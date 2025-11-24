import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Key, Ticket, TestTube2, FileText,
    ScrollText, Activity, Settings, LogOut, Menu, Rocket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: '首页', path: '/' },
    { icon: Ticket, label: 'Token 管理', path: '/tokens' },
    { icon: Key, label: '密钥管理', path: '/keys' },
    { icon: TestTube2, label: 'API 测试', path: '/test' },
    { icon: FileText, label: 'API 文档', path: '/docs' },
    { icon: ScrollText, label: '日志查看', path: '/logs' },
    { icon: Activity, label: '系统监控', path: '/monitor' },
    { icon: Settings, label: '系统设置', path: '/settings' },
];

export default function Layout() {
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-white flex">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/5 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-zinc-50/50 border-r border-zinc-200 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-sm">
                        <Rocket className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-zinc-900 text-sm leading-tight tracking-tight">Antigravity</h1>
                        <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Gateway</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50"
                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-zinc-900" : "text-zinc-400")} />
                                    {item.label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-200">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        退出登录
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-white">
                {/* Mobile Header */}
                <header className="lg:hidden h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
                            <Rocket className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-zinc-900">Antigravity</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-10 scroll-smooth">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Outlet />
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
