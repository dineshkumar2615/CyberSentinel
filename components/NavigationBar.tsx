'use client';
import Link from 'next/link';
import { Home, Scan, Map as MapIcon, Lock, Menu, X, Zap, Terminal, BookOpen, LogIn, UserPlus, LogOut, LayoutDashboard, Activity, Shield } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNavButtonVisible, setIsNavButtonVisible] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleMouseMove = () => {
            setIsNavButtonVisible(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setIsNavButtonVisible(false), 5000);
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Initial timer start
        timeoutRef.current = setTimeout(() => setIsNavButtonVisible(false), 5000);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const navItems = [
        { name: 'Feed Monitor', href: '/', icon: Home },
        { name: 'Neural Lab', href: '/scan', icon: Scan },
        { name: 'Diagnostics', href: '/diagnostics', icon: Activity },
        { name: 'Secure Messenger', href: '/secure-messenger', icon: Lock },
        { name: 'Education Hub', href: '/education', icon: BookOpen },
    ];

    return (
        <>
            {/* Hamburger Menu Button - Desktop Only */}
            <AnimatePresence>
                {!isSidebarOpen && isNavButtonVisible && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="hidden md:flex fixed top-4 left-4 z-[70] p-3 rounded-xl bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--glass-border)] hover:border-[var(--glass-border)] transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        <Menu size={20} className="text-[var(--foreground)]" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Bar - Glassmorphism */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--background)]/90 backdrop-blur-xl border-t border-[var(--glass-border)] z-50 pb-safe transition-colors duration-300">
                <div className="flex justify-around items-center h-16 w-full mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,157,0.05)_50%,transparent_100%)] opacity-30 pointer-events-none" />
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-neon-green' : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute top-0 w-8 h-1 bg-neon-green rounded-b-full shadow-[0_0_10px_#00ff9d]" />
                                )}
                                <item.icon size={24} className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]' : ''} />
                            </Link>
                        );
                    })}
                    {/* Dashboard Mobile Link */}
                    {session ? (
                        <Link
                            href="/dashboard"
                            className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${pathname === '/dashboard' ? 'text-neon-green' : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]'}`}
                        >
                            {pathname === '/dashboard' && (
                                <div className="absolute top-0 w-8 h-1 bg-neon-green rounded-b-full shadow-[0_0_10px_#00ff9d]" />
                            )}
                            <LayoutDashboard size={24} className={pathname === '/dashboard' ? 'drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]' : ''} />
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${pathname === '/login' ? 'text-neon-blue' : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]'}`}
                        >
                            {pathname === '/login' && (
                                <div className="absolute top-0 w-8 h-1 bg-neon-blue rounded-b-full shadow-[0_0_10px_rgba(0,210,255,0.5)]" />
                            )}
                            <LogIn size={24} className={pathname === '/login' ? 'drop-shadow-[0_0_8px_rgba(0,210,255,0.5)]' : ''} />
                        </Link>
                    )}
                </div>
            </nav>

            {/* Desktop Sidebar - Collapsible */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="hidden md:block fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        />

                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-[var(--background)] border-r border-[var(--glass-border)] z-[65] overflow-hidden text-[var(--foreground)]"
                        >
                            {/* Background Tech Pattern */}
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(var(--foreground-rgb),0.5)_3px)] opacity-[0.02] pointer-events-none" />
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-neon-blue/5 to-transparent pointer-events-none" />

                            <div className="relative p-6 mb-6">
                                <div className="flex items-start justify-between relative z-10 w-full mb-4">
                                    <ThemeToggle />
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
                                    >
                                        <X size={20} className="text-[var(--foreground)]/50 hover:text-[var(--foreground)]" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-neon-green/20 rotate-45 rounded-sm animate-pulse" />
                                        <div className="absolute inset-0 border border-neon-green rotate-45 rounded-sm" />
                                        <Zap size={20} className="text-neon-green relative z-10 fill-current" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-black text-[var(--foreground)] italic tracking-tighter leading-none">
                                            CYBER<span className="text-neon-green">SENTINEL</span>
                                        </h1>
                                        <div className="text-[9px] text-neon-green/60 font-mono tracking-widest mt-1">
                                            ACTIVE_SECURE
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 space-y-2 flex-1 relative z-10">
                                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-4 mb-2">Main Modules</div>
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`relative flex items-center gap-4 px-4 py-3 rounded-lg transition-all group overflow-hidden ${isActive
                                                ? 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-neon-green'
                                                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--glass-bg)] border border-transparent'
                                                }`}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-green shadow-[0_0_10px_#00ff9d]" />
                                            )}
                                            <item.icon
                                                size={20}
                                                className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-neon-green drop-shadow-[0_0_5px_currentColor]' : ''
                                                    }`}
                                            />
                                            <span className="text-xs font-bold uppercase tracking-wider">{item.name}</span>

                                            {isActive && (
                                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-auto relative z-10 px-4 pb-6 space-y-2">
                                {session ? (
                                    <>
                                        <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/30">
                                                {session.user?.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-[var(--foreground)] truncate uppercase tracking-tighter italic">{session.user?.name}</p>
                                                <p className="text-[9px] text-[var(--text-muted)] font-mono italic">Security Status: Active</p>
                                            </div>
                                        </div>
                                        {(session.user as any)?.role === 'admin' && (
                                            <Link
                                                href="/admin/dashboard"
                                                onClick={() => setIsSidebarOpen(false)}
                                                className="flex items-center gap-4 px-4 py-3 rounded-lg bg-neon-red/10 text-neon-red border border-neon-red/20 hover:bg-neon-red/20 transition-all group"
                                            >
                                                <Shield size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Command Center</span>
                                            </Link>
                                        )}
                                        {(session.user as any)?.role !== 'admin' && (
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setIsSidebarOpen(false)}
                                                className="flex items-center gap-4 px-4 py-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
                                            >
                                                <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                signOut({ callbackUrl: "/" });
                                                setIsSidebarOpen(false);
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/5 border border-transparent hover:border-red-400/20 transition-all group"
                                        >
                                            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Log Out</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            onClick={() => setIsSidebarOpen(false)}
                                            className="flex items-center gap-4 px-4 py-3 rounded-lg text-[var(--foreground)]/60 hover:text-neon-blue hover:bg-neon-blue/5 border border-transparent hover:border-neon-blue/20 transition-all group"
                                        >
                                            <LogIn size={20} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Log In</span>
                                        </Link>
                                        <Link
                                            href="/signup"
                                            onClick={() => setIsSidebarOpen(false)}
                                            className="flex items-center gap-4 px-4 py-3 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 transition-all group shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                                        >
                                            <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Sign Up</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence >
        </>
    );
}
