import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, RefreshCw, Trash2, Power, LogIn, Upload, Download,
    CheckCircle2, XCircle, Search, MoreVertical, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Tokens() {
    const { token: adminToken } = useAuth();
    const [tokens, setTokens] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTokens, setSelectedTokens] = useState(new Set());
    const [manualUrl, setManualUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

    const fetchTokens = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/admin/tokens', {
                headers: { 'X-Admin-Token': adminToken }
            });
            const data = await res.json();

            // Fetch details for names
            if (data.length > 0) {
                const indices = data.map(t => t.index);
                const detailsRes = await fetch('/admin/tokens/details', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Token': adminToken
                    },
                    body: JSON.stringify({ indices })
                });
                const details = await detailsRes.json();
                const detailsMap = {};
                details.forEach(d => detailsMap[d.index] = d);

                const enrichedTokens = data.map(t => ({
                    ...t,
                    ...detailsMap[t.index]
                }));
                setTokens(enrichedTokens);
            } else {
                setTokens([]);
            }
        } catch (error) {
            console.error('Failed to fetch tokens', error);
            setMessage({ type: 'error', content: '加载 Token 失败' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTokens();
    }, [adminToken]);

    const handleGoogleLogin = async () => {
        try {
            const res = await fetch('/admin/tokens/login', {
                method: 'POST',
                headers: { 'X-Admin-Token': adminToken }
            });
            const data = await res.json();
            if (data.success && data.authUrl) {
                window.open(data.authUrl, '_blank');
                setMessage({ type: 'info', content: '已打开登录页面，完成后请刷新列表' });
                // Auto refresh after 10s
                setTimeout(fetchTokens, 10000);
            } else {
                setMessage({ type: 'error', content: data.message || '启动登录失败' });
            }
        } catch (error) {
            setMessage({ type: 'error', content: '请求失败: ' + error.message });
        }
    };

    const handleManualAdd = async () => {
        if (!manualUrl) return;
        setIsAdding(true);
        try {
            // Extract code from URL if full URL is pasted
            let code = manualUrl;
            if (manualUrl.includes('code=')) {
                code = new URL(manualUrl).searchParams.get('code');
            }

            const res = await fetch('/admin/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify({ url: manualUrl })
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', content: 'Token 添加成功' });
                setManualUrl('');
                fetchTokens();
            } else {
                setMessage({ type: 'error', content: data.error || '添加失败' });
            }
        } catch (error) {
            setMessage({ type: 'error', content: '请求失败: ' + error.message });
        } finally {
            setIsAdding(false);
        }
    };

    const toggleToken = async (index, enable) => {
        try {
            const res = await fetch('/admin/tokens/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify({ index, enable })
            });
            if (res.ok) {
                fetchTokens();
            }
        } catch (error) {
            console.error('Toggle failed', error);
        }
    };

    const deleteToken = async (index) => {
        if (!confirm('确定要删除这个 Token 吗？')) return;
        try {
            const res = await fetch(`/admin/tokens/${index}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Token': adminToken }
            });
            if (res.ok) {
                fetchTokens();
                const newSelected = new Set(selectedTokens);
                newSelected.delete(index);
                setSelectedTokens(newSelected);
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const toggleSelection = (index) => {
        const newSelected = new Set(selectedTokens);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedTokens(newSelected);
    };

    const selectAll = () => {
        if (selectedTokens.size === tokens.length) {
            setSelectedTokens(new Set());
        } else {
            setSelectedTokens(new Set(tokens.map(t => t.index)));
        }
    };

    const exportTokens = async () => {
        if (selectedTokens.size === 0) return alert('请先选择要导出的账号');
        try {
            const res = await fetch('/admin/tokens/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': adminToken
                },
                body: JSON.stringify({ indices: Array.from(selectedTokens) })
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tokens_export_${new Date().toISOString().slice(0, 10)}.zip`;
                a.click();
            }
        } catch (error) {
            console.error('Export failed', error);
        }
    };

    const importTokens = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/admin/tokens/import', {
                    method: 'POST',
                    headers: { 'X-Admin-Token': adminToken },
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    setMessage({ type: 'success', content: `成功导入 ${data.count} 个 Token` });
                    fetchTokens();
                } else {
                    setMessage({ type: 'error', content: data.error || '导入失败' });
                }
            } catch (error) {
                setMessage({ type: 'error', content: '导入失败: ' + error.message });
            }
        };
        input.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
                <div>
                    <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Token 管理</h2>
                    <p className="text-base text-zinc-500 mt-1">管理 Google OAuth 账号和 Access Token</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchTokens}
                        className="p-2.5 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="刷新列表"
                    >
                        <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleGoogleLogin}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium rounded-xl transition-all shadow-sm hover:shadow-md text-sm"
                    >
                        <LogIn className="w-4 h-4 text-blue-600" />
                        Google 登录
                    </button>
                    <div className="w-px h-10 bg-zinc-200 hidden md:block" />
                    <button
                        onClick={exportTokens}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-xl transition-colors text-sm"
                    >
                        <Download className="w-4 h-4" />
                        导出选中
                    </button>
                    <button
                        onClick={importTokens}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-xl transition-colors text-sm"
                    >
                        <Upload className="w-4 h-4" />
                        导入
                    </button>
                </div>

                <div className="flex gap-3 items-center">
                    <input
                        type="text"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="粘贴回调链接以手动添加..."
                        className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 outline-none transition-all text-sm placeholder:text-zinc-400"
                    />
                    <button
                        onClick={handleManualAdd}
                        disabled={!manualUrl || isAdding}
                        className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isAdding ? '添加中...' : '添加'}
                    </button>
                </div>

                <AnimatePresence>
                    {message.content && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                                "flex items-center gap-2 p-3 rounded-lg text-sm font-medium",
                                message.type === 'error' ? "bg-red-50 text-red-600 border border-red-100" :
                                    message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                        "bg-blue-50 text-blue-600 border border-blue-100"
                            )}
                        >
                            <AlertCircle className="w-4 h-4" />
                            {message.content}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Token List */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={tokens.length > 0 && selectedTokens.size === tokens.length}
                            onChange={selectAll}
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                        <span className="text-sm font-medium text-zinc-600">全选 ({selectedTokens.size})</span>
                    </div>
                    <div className="text-sm text-zinc-400">共 {tokens.length} 个账号</div>
                </div>

                {tokens.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">
                        {isLoading ? '加载中...' : '暂无 Token 账号'}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {tokens.map((t) => (
                            <motion.div
                                key={t.index}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                    "p-5 hover:bg-zinc-50/50 transition-colors group",
                                    selectedTokens.has(t.index) && "bg-zinc-50"
                                )}
                            >
                                <div className="flex items-start gap-5">
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedTokens.has(t.index)}
                                            onChange={() => toggleSelection(t.index)}
                                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <h3 className="font-semibold text-zinc-900 truncate text-base">{t.name || 'Unknown'}</h3>
                                            {t.enable ? (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> 已启用
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> 已禁用
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-500 mb-3">{t.email || 'No Email'}</p>
                                        <div className="bg-zinc-50 rounded-lg px-3 py-2 text-xs font-mono text-zinc-600 truncate max-w-2xl border border-zinc-200/50">
                                            {t.access_token}
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
                                            <span>创建: {t.created}</span>
                                            <span>过期: {t.expires_in}s</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleToken(t.index, !t.enable)}
                                            className={cn(
                                                "p-2.5 rounded-lg transition-colors",
                                                t.enable ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                                            )}
                                            title={t.enable ? "禁用" : "启用"}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteToken(t.index)}
                                            className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
