# Antigravity Gateway

<div align="center">
  <img src="client/public/rocket.svg" width="120" alt="Antigravity Logo" />
  <h3>Google Antigravity API to OpenAI Proxy</h3>
  <p>
    将 Google Antigravity API 转换为 OpenAI 兼容格式的高性能网关服务。
    <br />
    内置现代化管理后台，支持多账号轮询、Token 自动刷新、密钥管理与实时监控。
  </p>
</div>

---

## ✨ 功能特性

### 核心功能
- **OpenAI 兼容**: 完全兼容 OpenAI Chat Completions API 格式，无缝对接现有生态。
- **流式响应**: 支持 SSE (Server-Sent Events) 流式输出，体验流畅。
- **多模态支持**: 支持文本及 Base64 编码的图片输入 (GPT-4 Vision 兼容)。
- **工具调用**: 支持 Function Calling，扩展模型能力。

### 增强特性
- **多账号池**: 支持配置多个 Google 账号，自动负载均衡与轮询。
- **Token 自动保活**: 内置 Token 刷新机制，自动处理过期与 403 错误。
- **高并发支持**: 优化的请求处理队列，支持高并发场景。

### 管理后台 (Dashboard)
- **现代化 UI**: 基于 React + Tailwind CSS 构建的极简主义设计风格。
- **密钥管理**: 创建、删除、禁用 API Key，支持设置额度与过期时间。
- **Token 管理**: 可视化管理 Google 账号，实时查看 Token 状态。
- **系统监控**: 实时监控 CPU、内存、请求数与响应时间。
- **在线测试**: 内置 Chat 调试界面，方便测试模型效果。
- **日志审计**: 完整的请求日志记录与查询。

## 🛠️ 技术栈

- **后端**: Node.js (Express), Native Fetch
- **前端**: React, Vite, Tailwind CSS, Framer Motion, Lucide React
- **数据存储**: 本地 JSON 文件存储 (轻量级，无外部数据库依赖)

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0

### 1. 安装与构建

```bash
# 安装项目依赖
npm install

# 构建前端资源
npm run build
```

### 2. 配置服务

编辑根目录下的 `config.json` 文件：

```json
{
  "server": {
    "port": 8045,           // 服务端口
    "host": "0.0.0.0"       // 监听地址
  },
  "security": {
    "apiKey": "sk-admin",   // 管理员/默认 API Key
    "maxRequestSize": "50mb" // 最大请求体大小
  },
  "defaults": {
    "model": "gemini-2.0-flash-exp" // 默认模型
  }
}
```

### 3. 添加 Google 账号

运行 OAuth 登录脚本获取 Access Token：

```bash
npm run login
```
按提示在浏览器中授权，获取的 Token 将自动保存到 `data/accounts.json`。

### 4. 启动服务

```bash
# 生产模式
npm start

# 开发模式 (支持热重载)
npm run dev
```

服务启动后，访问 `http://localhost:8045` 进入管理后台。

## 🔌 API 使用指南

### 基础 URL
`http://localhost:8045`

### 认证
所有请求需在 Header 中携带 API Key：
`Authorization: Bearer <YOUR_API_KEY>`

### 1. 获取模型列表
`GET /v1/models`

### 2. 聊天补全
`POST /v1/chat/completions`

**请求示例:**
```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-admin" \
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

## 📂 项目结构

```
.
├── client/                 # 前端 React 项目
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面组件
│   │   └── ...
│   └── ...
├── data/                   # 数据存储目录
│   ├── accounts.json       # Google 账号数据
│   ├── keys.json           # API Key 数据
│   └── ...
├── src/                    # 后端源码
│   ├── server/             # 服务器入口
│   ├── api/                # API 路由处理
│   ├── auth/               # 认证与 Token 管理
│   └── ...
├── scripts/                # 工具脚本
├── config.json             # 配置文件
└── package.json
```

## 📝 License

MIT License
