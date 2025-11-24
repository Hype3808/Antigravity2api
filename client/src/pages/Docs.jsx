import { useState, useEffect } from 'react';
import { Book, Globe, MessageSquare, Shield, Zap, Lightbulb, Code2 } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import { cn } from '../lib/utils';

export default function Docs() {
    // 动态获取基础 URL
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        // 获取当前访问的协议、域名/IP 和端口
        const protocol = window.location.protocol; // http: 或 https:
        const host = window.location.host; // 包含域名/IP 和端口
        setBaseUrl(`${protocol}//${host}`);
    }, []);

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <h2 className="text-2xl font-semibold text-zinc-900 mb-2 tracking-tight">API 文档</h2>
                <p className="text-zinc-500">Antigravity API 提供与 OpenAI 兼容的接口,可无缝对接现有应用。</p>
            </div>

            {/* Base URL */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2 text-base">
                    <Globe className="w-5 h-5 text-zinc-900" />
                    基础 URL
                </h3>
                <CodeBlock code={baseUrl || 'Loading...'} />
            </div>

            {/* Endpoints */}
            <div className="space-y-6">
                <EndpointCard
                    method="GET"
                    path="/v1/models"
                    title="获取模型列表"
                    desc="获取所有可用的 AI 模型列表。"
                    req={`curl ${baseUrl}/v1/models \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    res={`{
  "object": "list",
  "data": [
    {
      "id": "gemini-2.0-flash-exp",
      "object": "model",
      "created": 1234567890,
      "owned_by": "google"
    }
  ]
}`}
                />

                <EndpointCard
                    method="POST"
                    path="/v1/chat/completions"
                    title="聊天补全"
                    desc="创建聊天对话补全,支持流式和非流式响应。"
                    req={`curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [
      {"role": "user", "content": "你好"}
    ],
    "stream": true
  }'`}
                    res={`data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk",...}

data: [DONE]`}
                />
            </div>

            {/* Auth Info */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                    <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2 text-base">
                        <Shield className="w-5 h-5 text-zinc-900" />
                        认证方式
                    </h3>
                    <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                        所有 API 请求都需要在请求头中包含有效的 API 密钥:
                    </p>
                    <CodeBlock code="Authorization: Bearer YOUR_API_KEY" />
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                    <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2 text-base">
                        <Zap className="w-5 h-5 text-zinc-900" />
                        频率限制
                    </h3>
                    <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                        当请求超过频率限制时,API 会返回 429 状态码。响应头包含限制详情:
                    </p>
                    <ul className="text-sm text-zinc-500 space-y-2 list-disc list-inside marker:text-zinc-300">
                        <li><code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 border border-zinc-200">X-RateLimit-Limit</code>: 最大请求数</li>
                        <li><code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 border border-zinc-200">X-RateLimit-Remaining</code>: 剩余请求数</li>
                        <li><code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 border border-zinc-200">X-RateLimit-Reset</code>: 重置等待秒数</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function EndpointCard({ method, path, title, desc, req, res }) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-zinc-100">
                <div className="flex items-center gap-3 mb-3">
                    <span className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold tracking-wide",
                        method === 'GET' ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    )}>
                        {method}
                    </span>
                    <code className="text-zinc-700 font-mono font-semibold text-sm bg-zinc-50 px-2 py-1 rounded border border-zinc-200/50">{path}</code>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </div>

            <div className="bg-zinc-50/50 p-6 space-y-6">
                <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                        Request
                    </div>
                    <CodeBlock code={req} />
                </div>
                <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                        Response
                    </div>
                    <CodeBlock code={res} />
                </div>
            </div>
        </div>
    );
}
