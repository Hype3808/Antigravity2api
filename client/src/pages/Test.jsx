import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, RefreshCw, Bot, User, Key, Settings2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Test() {
    const { token: adminToken } = useAuth();
    // Initialize state from localStorage
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('test_messages');
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState('');
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('test_selected_model') || '');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('test_api_key') || '');

    // Persist API key
    useEffect(() => {
        localStorage.setItem('test_api_key', apiKey);
    }, [apiKey]);

    // Persist messages
    useEffect(() => {
        localStorage.setItem('test_messages', JSON.stringify(messages));
    }, [messages]);

    // Persist selected model
    useEffect(() => {
        if (selectedModel) {
            localStorage.setItem('test_selected_model', selectedModel);
        }
    }, [selectedModel]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchModels = async () => {
        try {
            const headers = {};
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            else if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

            const res = await fetch('/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey || 'sk-test'}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setModels(data.data || []);
                if (data.data?.length > 0 && !selectedModel) setSelectedModel(data.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch models', error);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !selectedModel) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setIsStreaming(true);

        const assistantMsgId = Date.now();
        setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantMsgId }]);

        try {
            const response = await fetch('/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey || 'sk-test'}`
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const content = data.choices[0]?.delta?.content || '';
                            assistantContent += content;

                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMsgId ? { ...msg, content: assistantContent } : msg
                            ));
                        } catch (e) {
                            console.error('Error parsing chunk', e);
                        }
                    }
                }
            }
        } catch (error) {
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId ? { ...msg, content: `Error: ${error.message}` } : msg
            ));
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                            <Bot className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">开始一段新的对话...</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-4 max-w-3xl",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                msg.role === 'user'
                                    ? "bg-zinc-900 text-white border-zinc-900"
                                    : "bg-white text-zinc-600 border-zinc-200"
                            )}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={cn(
                                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border",
                                msg.role === 'user'
                                    ? "bg-zinc-900 text-white border-zinc-900 rounded-tr-none"
                                    : "bg-white border-zinc-200 text-zinc-800 rounded-tl-none"
                            )}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-zinc-200">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="输入消息..."
                            className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none transition-all text-sm placeholder:text-zinc-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2 text-sm"
                        >
                            <Send className="w-4 h-4" />
                            发送
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
                    <h3 className="font-semibold text-zinc-900 flex items-center gap-2 text-base">
                        <Settings2 className="w-5 h-5" />
                        配置
                    </h3>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">模型</label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-zinc-900 outline-none transition-all"
                                >
                                    {models.length === 0 && <option>加载中...</option>}
                                    {models.map(m => (
                                        <option key={m.id} value={m.id}>{m.id}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={fetchModels}
                                    className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1.5">API Key</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-zinc-900 outline-none transition-all placeholder:text-zinc-400"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setMessages([])}
                            className="w-full py-2.5 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 border border-red-100 hover:border-red-200 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            清空对话
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
