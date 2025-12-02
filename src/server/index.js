import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateAssistantResponse, generateAssistantResponseNoStream, getAvailableModels, closeRequester } from '../api/client.js';
import { generateRequestBody } from '../utils/utils.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import adminRoutes, { incrementRequestCount, addLog } from '../admin/routes.js';
import { validateKey, checkRateLimit } from '../admin/key_manager.js';
import idleManager from '../utils/idle_manager.js';
import tokenManager from '../auth/token_manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保必要的目录存在
const ensureDirectories = () => {
  const dirs = ['data', 'uploads'];
  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`创建目录: ${dir}`);
    }
  });
};

ensureDirectories();

const app = express();

app.use(express.json({ limit: config.security.maxRequestSize }));

// 静态文件服务 - 提供管理控制台页面
app.use(express.static(path.join(process.cwd(), 'client/dist')));

// 静态文件服务：提供图片访问
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: `请求体过大，最大支持 ${config.security.maxRequestSize}` });
  }
  next(err);
});

// ... (rest of the file)



// 请求日志中间件
app.use((req, res, next) => {
  // 记录请求活动，管理空闲状态
  if (req.path.startsWith('/v1/')) {
    idleManager.recordActivity();
  }

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.path, res.statusCode, duration);

    // 记录到管理日志
    if (req.path.startsWith('/v1/')) {
      incrementRequestCount();
      addLog('info', `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API 密钥验证和频率限制中间件
app.use(async (req, res, next) => {
  if (req.path.startsWith('/v1/')) {
    const apiKey = config.security?.apiKey;
    if (apiKey) {
      const authHeader = req.headers.authorization;
      const providedKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

      // 先检查配置文件中的密钥（不受频率限制）
      if (providedKey === apiKey) {
        return next();
      }

      // 再检查数据库中的密钥
      const isValid = await validateKey(providedKey);
      if (!isValid) {
        logger.warn(`API Key 验证失败: ${req.method} ${req.path}`);
        await addLog('warn', `API Key 验证失败: ${req.method} ${req.path}`);
        return res.status(401).json({ error: 'Invalid API Key' });
      }

      // 检查频率限制
      const rateLimitCheck = await checkRateLimit(providedKey);
      if (!rateLimitCheck.allowed) {
        logger.warn(`频率限制: ${req.method} ${req.path} - ${rateLimitCheck.error}`);
        await addLog('warn', `频率限制触发: ${providedKey.substring(0, 10)}...`);

        res.setHeader('X-RateLimit-Limit', rateLimitCheck.limit || 0);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', rateLimitCheck.resetIn || 0);

        return res.status(429).json({
          error: {
            message: rateLimitCheck.error,
            type: 'rate_limit_exceeded',
            reset_in_seconds: rateLimitCheck.resetIn
          }
        });
      }

      // 设置频率限制响应头
      if (rateLimitCheck.limit) {
        res.setHeader('X-RateLimit-Limit', rateLimitCheck.limit);
        res.setHeader('X-RateLimit-Remaining', rateLimitCheck.remaining);
      }
    }
  }
  next();
});

// 管理路由
app.use('/admin', adminRoutes);

app.get('/v1/models', async (req, res) => {
  try {
    const models = await getAvailableModels();
    // Add fake streaming models with 假流式/ prefix
    const fakeStreamingModels = models.data.map(model => ({
      ...model,
      id: `假流式/${model.id}`,
      created: Math.floor(Date.now() / 1000)
    }));
    models.data = [...models.data, ...fakeStreamingModels];
    res.json(models);
  } catch (error) {
    logger.error('获取模型列表失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/v1/chat/completions', async (req, res) => {
  let { messages, model, stream = true, tools, ...params } = req.body;
  try {

    if (!messages) {
      return res.status(400).json({ error: 'messages is required' });
    }
    
    const token = await tokenManager.getToken();
    if (!token) {
      throw new Error('没有可用的token，请运行 npm run login 获取token');
    }

    // Check if fake streaming is requested
    const isFakeStreaming = model && model.startsWith('假流式/');
    let actualModel = model;
    if (isFakeStreaming) {
      actualModel = model.slice('假流式/'.length);
    }
    
    // Check if image model is requested
    const isImageModel = actualModel.includes('-image');

    // 智能检测：NewAPI测速请求通常消息很简单，强制使用非流式响应
    // 检测条件：单条消息 + 内容很短（如 "hi", "test" 等）
    const isSingleShortMessage = messages.length === 1 &&
      messages[0].content &&
      messages[0].content.length < 20;

    // 如果检测到可能是测速请求，且未明确要求流式，则使用非流式
    if (isSingleShortMessage && req.body.stream === undefined) {
      stream = false;
    }
    
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    // Use actualModel for the API request body, not the model with 假流式/ prefix
    const requestBody = generateRequestBody(messages, actualModel, params, tools, apiKey);
    
    // Handle image model configuration
    if (isImageModel) {
      requestBody.request.generationConfig = {
        candidateCount: 1,
      };
      requestBody.requestType = "image_gen";
      requestBody.request.systemInstruction.parts[0].text += "现在你作为绘画模型聚焦于帮助用户生成图片";
      delete requestBody.request.tools;
      delete requestBody.request.toolConfig;
    }

    // Handle fake streaming
    if (isFakeStreaming && stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const id = `chatcmpl-${Date.now()}`;
      const created = Math.floor(Date.now() / 1000);

      // Send initial role
      res.write(`data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created,
        model: actualModel,
        choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
      })}\n\n`);

      // Send empty chunks every 3 seconds while waiting for response
      const sendEmptyChunk = () => {
        if (!res.writableEnded) {
          try {
            res.write(`data: ${JSON.stringify({
              id,
              object: 'chat.completion.chunk',
              created,
              model: actualModel,
              choices: [{ index: 0, delta: { content: '' }, finish_reason: null }]
            })}\n\n`);
          } catch (err) {
            logger.error('Error sending heartbeat chunk:', err.message);
          }
        }
      };

      // Start sending empty chunks every 3 seconds
      const interval = setInterval(sendEmptyChunk, 3000);

      try {
        // Fetch complete non-streaming response
        const { content, toolCalls } = await generateAssistantResponseNoStream(requestBody, token);
        
        // Clear interval before sending final chunks
        clearInterval(interval);

        // Send tool calls if any
        if (toolCalls.length > 0) {
          res.write(`data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model: actualModel,
            choices: [{ index: 0, delta: { tool_calls: toolCalls }, finish_reason: null }]
          })}\n\n`);
        }

        // Send content
        if (content) {
          res.write(`data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model: actualModel,
            choices: [{ index: 0, delta: { content: content }, finish_reason: null }]
          })}\n\n`);
        }

        // Send finish
        res.write(`data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model: actualModel,
          choices: [{ index: 0, delta: {}, finish_reason: toolCalls.length > 0 ? 'tool_calls' : 'stop' }]
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error) {
        clearInterval(interval);
        logger.error('Error in fake streaming:', error.message);
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model: actualModel,
            choices: [{ index: 0, delta: { content: `Error: ${error.message}` }, finish_reason: null }]
          })}\n\n`);
          res.write(`data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model: actualModel,
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
          })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
      }
      return;
    }

    if (stream && !isFakeStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const id = `chatcmpl-${Date.now()}`;
      const created = Math.floor(Date.now() / 1000);
      
      if (isImageModel) {
        const { content } = await generateAssistantResponseNoStream(requestBody, token);
        res.write(`data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: { content }, finish_reason: null }]
        })}\n\n`);
        res.write(`data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        let hasToolCall = false;
        await generateAssistantResponse(requestBody, token, (data) => {
          const delta = data.type === 'tool_calls' 
            ? { tool_calls: data.tool_calls } 
            : { content: data.content };
          if (data.type === 'tool_calls') hasToolCall = true;
          res.write(`data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{ index: 0, delta, finish_reason: null }]
          })}\n\n`);
        });

        res.write(`data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: {}, finish_reason: hasToolCall ? 'tool_calls' : 'stop' }]
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } else if (!stream) {
      // Non-streaming response
      const { content, toolCalls } = await generateAssistantResponseNoStream(requestBody, token);
      const message = { role: 'assistant', content };
      if (toolCalls.length > 0) message.tool_calls = toolCalls;
      
      res.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          message,
          finish_reason: toolCalls.length > 0 ? 'tool_calls' : 'stop'
        }]
      });
    }
  } catch (error) {
    logger.error('生成响应失败:', error.message);
    if (!res.headersSent) {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const id = `chatcmpl-${Date.now()}`;
        const created = Math.floor(Date.now() / 1000);
        res.write(`data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: { content: `错误: ${error.message}` }, finish_reason: null }]
        })}\n\n`);
        res.write(`data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
});

// 所有其他请求返回 index.html (SPA 支持)
// Express 5 requires (.*) instead of * for wildcard
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client/dist', 'index.html'));
});

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`服务器已启动: ${config.server.host}:${config.server.port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`端口 ${config.server.port} 已被占用`);
    process.exit(1);
  } else if (error.code === 'EACCES') {
    logger.error(`端口 ${config.server.port} 无权限访问`);
    process.exit(1);
  } else {
    logger.error('服务器启动失败:', error.message);
    process.exit(1);
  }
});

const shutdown = () => {
  logger.info('正在关闭服务器...');

  // 清理空闲管理器
  idleManager.destroy();
  
  // 关闭 AntigravityRequester
  closeRequester();

  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
