import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Command, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function AuthOverlay() {
    const { isAuthenticated, login } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!password) return;

        setIsSubmitting(true);
        setError('');

        await new Promise(resolve => setTimeout(resolve, 600));

        const result = await login(password);
        if (!result.success) {
            setError(result.error);
            setPassword('');
        }
        setIsSubmitting(false);
    };

    if (isAuthenticated) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            {/* 极简网格背景 */}
            <div className="absolute inset-0 subtle-grid opacity-40" />

            {/* 顶部装饰 */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[360px] mx-auto z-10"
            >
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl shadow-zinc-200/50 p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-10 h-10 mb-4 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200">
                            <Command className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight mb-1">
                            Antigravity
                        </h1>
                        <p className="text-zinc-500 text-sm">
                            请输入访问密码
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                    placeholder="Password"
                                    className={cn(
                                        "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400",
                                        "focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all duration-200",
                                        "text-sm font-medium tracking-widest placeholder:tracking-normal",
                                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/5 bg-red-50/50 text-red-900 placeholder:text-red-300"
                                    )}
                                    autoFocus
                                />
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[11px] font-medium text-red-600 pl-1"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !password}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg",
                                "bg-zinc-900 text-white font-medium text-sm",
                                "hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                                "shadow-sm hover:shadow-md"
                            )}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span>进入系统</span>
                                    <ArrowRight className="w-4 h-4 opacity-50" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/50 border border-zinc-200/50 text-[10px] font-medium text-zinc-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span>SECURE GATEWAY</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
