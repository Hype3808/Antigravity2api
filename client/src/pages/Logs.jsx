import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Trash2, ScrollText, Pause, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Logs() {
    const { token: adminToken } = useAuth();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const logsEndRef = useRef(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/admin/logs', {
                headers: { 'X-Admin-Token': adminToken }
            });
            const text = await res.text();
            // Parse logs: Assuming they are line separated JSON or text
            let logLines = [];
            try {
                const json = JSON.parse(text);
                if (Array.isArray(json)) logLines = json;
            } catch {
                logLines = text.split('\n').filter(Boolean);
            }
            setLogs(logLines);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [adminToken]);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 5000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, adminToken]);

    const clearLogs = async () => {
        if (!confirm('确定要清空日志吗？')) return;
        try {
            await fetch('/admin/logs', {
                method: 'DELETE',
                headers: { 'X-Admin-Token': adminToken }
            });
            setLogs([]);
        } catch (error) {
            console.error('Failed to clear logs', error);
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">系统日志</h2>
                    <p className="text-zinc-500">查看实时系统运行日志</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border",
                            autoRefresh
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        )}
                    >
                        {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {autoRefresh ? '自动刷新中' : '自动刷新'}
                    </button>
                    <button
                        onClick={fetchLogs}
                        className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
                    >
                        <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                    </button>
                    <button
                        onClick={clearLogs}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col shadow-inner">
                <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm">
                    {logs.length === 0 ? (
                        <div className="text-zinc-500 text-center py-12">暂无日志</div>
                    ) : (
                        logs.map((log, idx) => (
                            <div key={idx} className="text-zinc-300 break-all hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
                                {typeof log === 'string' ? log : JSON.stringify(log)}
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
}
