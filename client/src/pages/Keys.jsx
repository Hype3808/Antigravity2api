import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Key, Plus, Trash2, Copy, Check, Shield, Clock, Zap, AlertCircle, RefreshCw, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Keys() {
    const { token: adminToken } = useAuth();
    const [keys, setKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form State
    const [keyName, setKeyName] = useState('');
    const [customKey, setCustomKey] = useState('');
    const [enableRateLimit, setEnableRateLimit] = useState(false);
    const [maxRequests, setMaxRequests] = useState(100);
    const [windowSeconds, setWindowSeconds] = useState(60);

    const [copiedKey, setCopiedKey] = useState('');
    const [message, setMessage] = useState({ type: '', content: '' });

    // UI State
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, key: null });
    const [visibleKeys, setVisibleKeys] = useState(new Set());

    const fetchKeys = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/admin/keys', {
                headers: { 'X-Admin-Token': adminToken }
            });
            const data = await res.json();
            setKeys(data);
        } catch (error) {
            console.error('Failed to fetch keys', error);
            setMessage({ type: 'error', content: '加载密钥失败' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, [adminToken]);

    const generateKey = async () => {
        setIsGenerating(true);
        try {
            const body = {
                name: keyName,
                key: customKey || undefined,
                rate_limit: enableRateLimit ? {
                    requests: parseInt(maxRequests),
                    window: parseInt(windowSeconds)
                } : undefined
            };

            const res = await fetch('/admin/keys/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.key) {
                setMessage({ type: 'success', content: '密钥生成成功' });
                setKeyName('');
                setCustomKey('');
                setEnableRateLimit(false);
                fetchKeys();
            } else {
                setMessage({ type: 'error', content: data.error || '生成失败' });
            }
        } catch (error) {
            setMessage({ type: 'error', content: '请求失败: ' + error.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteClick = (key) => {
        setDeleteConfirm({ isOpen: true, key });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.key) return;

        try {
            const res = await fetch(`/admin/keys/${deleteConfirm.key}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Token': adminToken }
            });
            if (res.ok) {
                fetchKeys();
                setDeleteConfirm({ isOpen: false, key: null });
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(''), 2000);
    };

    const toggleKeyVisibility = (key) => {
        setVisibleKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const maskKey = (key) => {
        if (visibleKeys.has(key)) return key;
        return key.substring(0, 3) + '•'.repeat(20) + key.substring(key.length - 4);
    };

    return (
        <div className="space-y-8 relative">
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/5 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-zinc-200"
                        >
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-900 mb-2">确认删除密钥？</h3>
                                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                                    您确定要删除密钥 <code className="bg-zinc-100 px-2 py-1 rounded text-zinc-700 border border-zinc-200 font-mono">{deleteConfirm.key?.substring(0, 8)}...</code> 吗？<br />
                                    此操作无法撤销，相关应用将立即失去访问权限。
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setDeleteConfirm({ isOpen: false, key: null })}
                                        className="px-6 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium rounded-lg transition-colors text-sm"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
                                    >
                                        确认删除
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-end pb-2">
                <div>
                    <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">密钥管理</h2>
                    <p className="text-base text-zinc-500 mt-1">生成和管理 API 访问密钥</p>
                </div>
                <button
                    onClick={fetchKeys}
                    className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                    <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Generator Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm sticky top-24">
                        <h3 className="font-medium text-zinc-900 mb-6 flex items-center gap-2 text-base">
                            <Plus className="w-5 h-5" />
                            生成新密钥
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">密钥名称</label>
                                <input
                                    type="text"
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    placeholder="例如: 我的应用密钥"
                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none transition-all text-sm placeholder:text-zinc-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">自定义密钥 (可选)</label>
                                <div className="relative">
                                    <Key className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={customKey}
                                        onChange={(e) => setCustomKey(e.target.value)}
                                        placeholder="留空自动生成"
                                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none transition-all font-mono text-sm placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-50/50 rounded-lg border border-zinc-100">
                                <label className="flex items-center gap-3 cursor-pointer mb-3">
                                    <input
                                        type="checkbox"
                                        checked={enableRateLimit}
                                        onChange={(e) => setEnableRateLimit(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                    />
                                    <span className="text-sm font-medium text-zinc-700">启用频率限制</span>
                                </label>

                                <AnimatePresence>
                                    {enableRateLimit && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 overflow-hidden pt-1"
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">最大请求</label>
                                                    <input
                                                        type="number"
                                                        value={maxRequests}
                                                        onChange={(e) => setMaxRequests(e.target.value)}
                                                        min="1"
                                                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:border-zinc-900 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">窗口(秒)</label>
                                                    <input
                                                        type="number"
                                                        value={windowSeconds}
                                                        onChange={(e) => setWindowSeconds(e.target.value)}
                                                        min="1"
                                                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:border-zinc-900 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                onClick={generateKey}
                                disabled={isGenerating}
                                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-all disabled:opacity-50 shadow-sm hover:shadow-md text-sm mt-2"
                            >
                                {isGenerating ? '生成中...' : '生成密钥'}
                            </button>

                            <AnimatePresence>
                                {message.content && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-lg text-sm font-medium",
                                            message.type === 'error' ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                        )}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {message.content}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Keys List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/30 flex justify-between items-center">
                            <span className="text-sm font-medium text-zinc-600">密钥列表</span>
                            <span className="text-xs text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full font-medium">{keys.length} ACTIVE</span>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {keys.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                        <Key className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <p className="text-base text-zinc-500 font-medium">暂无 API 密钥</p>
                                    <p className="text-sm text-zinc-400 mt-1">请在左侧创建您的第一个密钥</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {keys.map((k) => (
                                        <motion.div
                                            key={k.key}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-6 hover:bg-zinc-50/50 transition-colors group"
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1 min-w-0 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-semibold text-zinc-900 text-base">{k.name || '未命名密钥'}</h3>
                                                        {k.rate_limit ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                                <Shield className="w-3.5 h-3.5" />
                                                                {k.rate_limit.requests}/{k.rate_limit.window}s
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                <Zap className="w-3.5 h-3.5" />
                                                                无限制
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <code className="bg-zinc-100 px-3 py-1.5 rounded-md text-sm font-mono text-zinc-600 border border-zinc-200/50 tracking-wide">
                                                            {maskKey(k.key)}
                                                        </code>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => toggleKeyVisibility(k.key)}
                                                                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                                                title={visibleKeys.has(k.key) ? "隐藏密钥" : "显示密钥"}
                                                            >
                                                                {visibleKeys.has(k.key) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => copyToClipboard(k.key)}
                                                                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                                                title="复制密钥"
                                                            >
                                                                {copiedKey === k.key ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>创建于: {new Date(k.created).toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteClick(k.key)}
                                                    className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                    title="删除密钥"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
