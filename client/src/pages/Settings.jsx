import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Server, Shield, Sliders, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Settings() {
    const { token: adminToken } = useAuth();
    const [settings, setSettings] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/admin/settings', {
                    headers: { 'X-Admin-Token': adminToken }
                });
                const data = await res.json();
                // Map nested backend data to flat UI state
                setSettings({
                    port: data.server?.port,
                    host: data.server?.host,
                    apiKey: data.security?.apiKey,
                    adminPassword: data.security?.adminPassword,
                    maxRequestSize: data.security?.maxRequestSize,
                    temperature: data.defaults?.temperature,
                    topP: data.defaults?.top_p,
                    topK: data.defaults?.top_k,
                    maxTokens: data.defaults?.max_tokens,
                    systemInstruction: data.systemInstruction
                });
            } catch (error) {
                console.error('Failed to fetch settings', error);
                setMessage({ type: 'error', content: '加载设置失败' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [adminToken]);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ type: '', content: '' });
        try {
            // Map flat UI state back to nested backend structure
            const payload = {
                server: {
                    port: settings.port,
                    host: settings.host
                },
                security: {
                    apiKey: settings.apiKey,
                    adminPassword: settings.adminPassword,
                    maxRequestSize: settings.maxRequestSize
                },
                defaults: {
                    temperature: settings.temperature,
                    top_p: settings.topP,
                    top_k: settings.topK,
                    max_tokens: settings.maxTokens
                },
                systemInstruction: settings.systemInstruction
            };

            const res = await fetch('/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', content: '设置保存成功' });
            } else {
                setMessage({ type: 'error', content: '保存失败' });
            }
        } catch (error) {
            setMessage({ type: 'error', content: '保存失败: ' + error.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-12 text-center text-zinc-400">加载中...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex justify-between items-center sticky top-0 bg-zinc-50/90 backdrop-blur-sm py-4 z-10">
                <div>
                    <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">系统设置</h2>
                    <p className="text-zinc-500">配置服务器参数和模型默认值</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? '保存中...' : '保存设置'}
                </button>
            </div>

            <AnimatePresence>
                {message.content && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                            "flex items-center gap-2 p-4 rounded-xl text-sm font-medium border",
                            message.type === 'error'
                                ? "bg-red-50 text-red-600 border-red-100"
                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}
                    >
                        <AlertCircle className="w-4 h-4" />
                        {message.content}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Server Config */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="font-semibold text-zinc-900 mb-6 flex items-center gap-2 text-base">
                    <Server className="w-5 h-5 text-zinc-900" />
                    服务器配置
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormInput
                        label="服务端口"
                        value={settings.port || ''}
                        onChange={v => handleChange('port', v)}
                        placeholder="8045"
                        type="number"
                    />
                    <FormInput
                        label="监听地址"
                        value={settings.host || ''}
                        onChange={v => handleChange('host', v)}
                        placeholder="0.0.0.0"
                    />
                </div>
            </div>

            {/* Security Config */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="font-semibold text-zinc-900 mb-6 flex items-center gap-2 text-base">
                    <Shield className="w-5 h-5 text-zinc-900" />
                    安全配置
                </h3>
                <div className="space-y-6">
                    <FormInput
                        label="默认 API 密钥"
                        value={settings.apiKey || ''}
                        onChange={v => handleChange('apiKey', v)}
                        placeholder="sk-test"
                        helper="此密钥不受频率限制约束，用于测试或内部使用"
                    />
                    <FormInput
                        label="管理员密码"
                        value={settings.adminPassword || ''}
                        onChange={v => handleChange('adminPassword', v)}
                        placeholder="admin123"
                        type="password"
                    />
                    <FormInput
                        label="最大请求体大小"
                        value={settings.maxRequestSize || ''}
                        onChange={v => handleChange('maxRequestSize', v)}
                        placeholder="50mb"
                    />
                </div>
            </div>

            {/* Model Defaults */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="font-semibold text-zinc-900 mb-6 flex items-center gap-2 text-base">
                    <Sliders className="w-5 h-5 text-zinc-900" />
                    模型默认参数
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormInput
                        label="Temperature"
                        value={settings.temperature || ''}
                        onChange={v => handleChange('temperature', parseFloat(v))}
                        type="number" step="0.1" min="0" max="2"
                    />
                    <FormInput
                        label="Top P"
                        value={settings.topP || ''}
                        onChange={v => handleChange('topP', parseFloat(v))}
                        type="number" step="0.01" min="0" max="1"
                    />
                    <FormInput
                        label="Top K"
                        value={settings.topK || ''}
                        onChange={v => handleChange('topK', parseInt(v))}
                        type="number" min="1"
                    />
                    <FormInput
                        label="最大 Token 数"
                        value={settings.maxTokens || ''}
                        onChange={v => handleChange('maxTokens', parseInt(v))}
                        type="number" min="1"
                    />
                </div>
            </div>

            {/* System Instruction */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="font-semibold text-zinc-900 mb-6 flex items-center gap-2 text-base">
                    <MessageSquare className="w-5 h-5 text-zinc-900" />
                    系统指令
                </h3>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">System Instruction</label>
                    <textarea
                        value={settings.systemInstruction || ''}
                        onChange={e => handleChange('systemInstruction', e.target.value)}
                        rows={5}
                        placeholder="输入系统提示词..."
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none transition-all resize-y text-sm placeholder:text-zinc-400"
                    />
                </div>
            </div>
        </div>
    );
}

function FormInput({ label, value, onChange, type = "text", placeholder, helper, ...props }) {
    return (
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none transition-all text-sm placeholder:text-zinc-400"
                {...props}
            />
            {helper && <p className="mt-1.5 text-xs text-zinc-400">{helper}</p>}
        </div>
    );
}
