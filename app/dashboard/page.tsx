"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Shield, User, Key, Save, LogOut, ChevronRight, 
    CheckCircle, Smartphone, Activity, Zap, 
    Settings, Clock, ShieldAlert, AlertTriangle, Star, Cpu, 
    RefreshCw, ChevronDown, Search, MessageSquare,
    BookOpen, X, Target, Landmark, ArrowUpRight, ArrowDownRight,
    Bell, Camera, AlertCircle, Lock, Terminal, ShieldCheck
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ThreatDetailModal from "@/components/ThreatDetailModal";
import { 
    AreaChart, Area, ResponsiveContainer, YAxis
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────
interface Threat {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    sourceType: string;
    timestamp: string;
    confidenceScore?: number;
    isHighlighted?: boolean;
}

interface Favorite {
    key: string;
    alias: string;
    channelId?: string;
    addedAt: string;
    platform?: string;
}

interface Notification {
    _id: string;
    type: 'messenger' | 'handshake';
    title: string;
    message: string;
    channelId?: string;
    timestamp: string;
    read: boolean;
}

interface DashboardData {
    threats: Threat[];
    savedThreats: Threat[];
    favorites: Favorite[];
    notifications: Notification[];
    loading: boolean;
    lastFetched: Date | null;
    error: string | null;
}

// ── Helpers ────────────────────────────────────────────
const severityColor = (s: string) => {
    switch (s) {
        case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
        case 'high':     return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
        case 'medium':   return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
        default:         return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    }
};

const buildSparkline = (threats: Threat[]) => {
    // Group by hour for last 8 hours
    const now = Date.now();
    return Array.from({ length: 8 }, (_, i) => {
        const hourStart = now - (8 - i) * 3600000;
        const hourEnd   = hourStart + 3600000;
        return {
            value: threats.filter(t => {
                const ts = new Date(t.timestamp).getTime();
                return ts >= hourStart && ts < hourEnd;
            }).length
        };
    });
};

// ── Reusable Card ──────────────────────────────────────
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl ${className}`}>
        {children}
    </div>
);

// ── Skeleton ───────────────────────────────────────────
const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`bg-[var(--glass-border)] rounded-lg animate-pulse ${className}`} />
);

// ── KPI Card ───────────────────────────────────────────
const KPICard = ({ title, value, sub, trend, icon: Icon, iconBg, data, loading }: {
    title: string; value: string | number; sub?: string; trend: string; icon: any;
    iconBg: string; data: { value: number }[]; loading: boolean;
}) => {
    const isPositive = trend.startsWith('+') || trend === '—';
    const idBase = title.replace(/[^a-zA-Z0-9]/g, '-');
    return (
        <Card className="p-4 lg:p-5 flex flex-col justify-between h-full shadow-sm transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${iconBg}`}>
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend === '—' ? null : isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {trend}
                </div>
            </div>
            {loading ? (
                <>
                    <Skeleton className="h-7 w-20 mt-2" />
                    <Skeleton className="h-3 w-24 mt-2" />
                </>
            ) : (
                <div className="mt-1">
                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
                    <p className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{value}</p>
                    {sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
                </div>
            )}
            <div className="h-10 mt-3 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`g-${idBase}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={isPositive ? '#10B981' : '#EF4444'} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill={`url(#g-${idBase})`} 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const SplitKPICard = ({ items, loading }: {
    items: {
        title: string; value: string | number; icon: any; iconBg: string;
    }[];
    loading: boolean;
}) => {
    return (
        <Card className="p-4 lg:p-5 flex flex-col justify-center h-full shadow-sm transition-all hover:scale-[1.02]">
            <div className="space-y-4">
                {items.map((item, idx) => (
                    <div key={item.title}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.iconBg}`}>
                                <item.icon size={16} />
                            </div>
                            <div>
                                <p className="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider leading-none mb-1.5">{item.title}</p>
                                {loading ? (
                                    <Skeleton className="h-5 w-12" />
                                ) : (
                                    <p className="text-xl font-bold text-[var(--foreground)] tracking-tight leading-none">{item.value}</p>
                                )}
                            </div>
                        </div>
                        {idx === 0 && <div className="mt-4 border-t border-[var(--glass-border)]/50 pt-0" />}
                    </div>
                ))}
            </div>
        </Card>
    );
};

// ── Main Page ──────────────────────────────────────────
export default function DashboardPage() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() { redirect("/login"); },
    });

    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [data, setData] = useState<DashboardData>({
        threats: [],
        savedThreats: [],
        favorites: [],
        notifications: [],
        loading: true,
        lastFetched: null,
        error: null,
    });

    // Popup state
    const [savedThreatPopup, setSavedThreatPopup] = useState(false);
    const [favPopup, setFavPopup] = useState(false);
    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

    // Dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [maintenanceNews, setMaintenanceNews] = useState<any>(null);
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

    // Environment Scanner State
    const [isEnvScanning, setIsEnvScanning] = useState(false);
    const [envScanProgress, setEnvScanProgress] = useState(0);
    const [envScanResult, setEnvScanResult] = useState<null | 'clean' | 'threats' | 'warning'>(null);
    const [envMeasures, setEnvMeasures] = useState<any>(null);

    const isMobileDevice = false; // Mobile native platform check removed

    const runEnvScan = async () => {
        if (isEnvScanning) return;
        setIsEnvScanning(true);
        setEnvScanResult(null);
        setEnvMeasures(null);
        setEnvScanProgress(0);
        
        // Gather real metrics
        let secureContext = window.isSecureContext;
        let isBot = navigator.webdriver;
        let cookiesEnabled = navigator.cookieEnabled;
        let ua = navigator.userAgent;
        let isBrave = (navigator as any).brave ? true : false;
        
        let pingStart = Date.now();
        try {
            await fetch('/api/ping').catch(() => {});
        } catch(e) {}
        let latency = Date.now() - pingStart;

        // Mobile parsing
        let isIOS = /iPad|iPhone|iPod/.test(ua);
        let isAndroid = /Android/.test(ua);
        let osVersion = 'Unknown';
        let deviceModel = 'Mobile Device';

        if (isAndroid) {
            const match = ua.match(/Android\s([0-9\.]+);\s([^;]+)/);
            if (match) {
                osVersion = `Android ${match[1]}`;
                deviceModel = match[2];
            } else {
                osVersion = 'Android';
            }
        } else if (isIOS) {
            const match = ua.match(/OS\s([0-9_]+)/);
            if (match) {
                osVersion = `iOS ${match[1].replace(/_/g, '.')}`;
            } else {
                osVersion = 'iOS';
            }
            deviceModel = ua.includes('iPad') ? 'iPad' : 'iPhone';
        }

        let connType = 'Wi-Fi / 4G';
        if ((navigator as any).connection) {
            connType = ((navigator as any).connection.effectiveType || 'Unknown').toUpperCase();
        }

        // Real-time checks using live Threat Intelligence data
        const activeMalware = data.threats.some(t => t.title.toLowerCase().includes('malware') || t.sourceType.toLowerCase().includes('virus'));
        const attackCount = data.threats.filter(t => t.timestamp && (Date.now() - new Date(t.timestamp).getTime() < 86400000)).length;
        const hasLeaks = data.threats.some(t => t.title.toLowerCase().includes('leak') || t.title.toLowerCase().includes('breach') || t.title.toLowerCase().includes('credentials'));

        const interval = setInterval(() => {
            setEnvScanProgress(p => {
                if (p >= 98) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setIsEnvScanning(false);
                        const isCompromised = isBot || !cookiesEnabled || (!secureContext && window.location.hostname !== 'localhost');
                        const intelAlert = activeMalware || hasLeaks;

                        if (isCompromised) {
                            setEnvScanResult('threats');
                        } else if (intelAlert) {
                            setEnvScanResult('warning');
                        } else {
                            setEnvScanResult('clean');
                        }

                        setEnvMeasures({
                            isMobile: isMobileDevice,
                            // Web
                            secureContext,
                            isBot,
                            cookiesEnabled,
                            browser: isBrave ? 'Brave' : ua.includes('Chrome') ? 'Chrome/Edge' : ua.includes('Firefox') ? 'Firefox' : 'Safari/Webkit',
                            latency,
                            intelAlert,
                            // Mobile
                            deviceModel,
                            malwareScan: activeMalware ? 'Threat Detected' : 'Clean',
                            networkAttacks: attackCount > 0 ? `${attackCount} Blocked` : 'None Detected',
                            dataLeaks: hasLeaks ? 'Exposed Data' : 'Secured'
                        });
                    }, 500);
                    return 100;
                }
                return p + (Math.random() * 8);
            });
        }, 150);
    };

    const profileRef = React.useRef<HTMLDivElement>(null);
    const notificationsRef = React.useRef<HTMLDivElement>(null);

    // Handshake Modal State
    const [showHandshakeModal, setShowHandshakeModal] = useState(false);
    const [selectedHandshakeKey, setSelectedHandshakeKey] = useState<string | null>(null);
    const [handshakeSender, setHandshakeSender] = useState<string | null>(null);
    const [isProcessingHandshake, setIsProcessingHandshake] = useState(false);

    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<'verify' | 'update'>('verify');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAll = useCallback(async () => {
        setData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const [threatsRes, savedRes, favsRes, maintRes, notifyRes] = await Promise.all([
                fetch(`/api/threats?days=${timeframe}`),
                fetch('/api/users/saved-threats'),
                fetch('/api/favorites'),
                fetch('/api/admin/maintenance'),
                fetch('/api/users/notifications')
            ]);
            const threats: Threat[]       = threatsRes.ok ? await threatsRes.json() : [];
            const savedThreats: Threat[]  = savedRes.ok    ? await savedRes.json()   : [];
            const favsData                = favsRes.ok      ? await favsRes.json()    : {};
            const favorites: Favorite[]   = favsData.favorites || [];
            const notifyData              = notifyRes.ok    ? await notifyRes.json()  : {};
            const notifications: Notification[] = notifyData.notifications || [];

            if (maintRes.ok) {
                const maintData = await maintRes.json();
                setMaintenanceNews(maintData);
            }

            setData({ threats, savedThreats, favorites, notifications, loading: false, lastFetched: new Date(), error: null });
        } catch (e) {
            setData(prev => ({ ...prev, loading: false, error: 'Failed to load dashboard data' }));
        }
    }, [timeframe]);

    const clearNotifications = async () => {
        try {
            const res = await fetch('/api/users/notifications', { method: 'DELETE' });
            if (res.ok) {
                setData(prev => ({ ...prev, notifications: [] }));
            }
        } catch (err) {
            console.error('Failed to clear notifications', err);
        }
    };

    const markNotificationRead = async (id: string) => {
        try {
            const res = await fetch('/api/users/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });
            if (res.ok) {
                setData(prev => ({
                    ...prev,
                    notifications: prev.notifications.map(n => n._id === id ? { ...n, read: true } : n)
                }));
            }
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const handleApproveHandshake = async () => {
        if (!selectedHandshakeKey || !handshakeSender) return;
        setIsProcessingHandshake(true);
        try {
            const acceptRes = await fetch('/api/messenger/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: selectedHandshakeKey })
            });
            if (acceptRes.ok) {
                await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: selectedHandshakeKey, alias: handshakeSender })
                });
                router.push(`/secure-messenger?key=${encodeURIComponent(selectedHandshakeKey)}`);
            } else {
                alert('Failed to accept the connection.');
            }
        } catch (err) {
            console.error("Error approving handshake:", err);
            alert('An error occurred.');
        } finally {
            setIsProcessingHandshake(false);
            setShowHandshakeModal(false);
        }
    };

    const handleDenyHandshake = () => {
        setShowHandshakeModal(false);
        setSelectedHandshakeKey(null);
        setHandshakeSender(null);
    };

    const handleNotificationClick = async (n: Notification) => {
        if (!n.read) {
            await markNotificationRead(n._id);
        }

        if (n.type === 'handshake') {
            try {
                const res = await fetch('/api/messenger/shared-keys');
                if (res.ok) {
                    const data = await res.json();
                    const senderMatch = n.message.match(/^([\w.-]+@[\w.-]+\.\w+)/);
                    let targetKey = null;
                    if (senderMatch && senderMatch[1]) {
                        const senderEmail = senderMatch[1].toLowerCase();
                        targetKey = data.keys?.find((k: any) => k.fromUser === senderEmail);
                    } else if (data.keys?.length > 0) {
                        targetKey = data.keys[0];
                    }

                    if (targetKey) {
                        setHandshakeSender(targetKey.fromUser);
                        setSelectedHandshakeKey(targetKey.encryptionKey);
                        setShowHandshakeModal(true);
                    } else {
                        router.push('/secure-messenger');
                    }
                } else {
                    router.push('/secure-messenger');
                }
            } catch (err) {
                console.error("Failed to fetch pending keys", err);
                router.push('/secure-messenger');
            }
        } else if (n.type === 'messenger' && n.channelId) {
            // Find the key in favorites
            const favorite = data.favorites.find(f => f.channelId === n.channelId);
            if (favorite) {
                router.push(`/secure-messenger?key=${encodeURIComponent(favorite.key)}`);
            } else {
                // FALLBACK: If we can't find the key, just go to messenger
                router.push('/secure-messenger');
            }
        }
    };

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Derived stats ────────────────────────────────────
    const { threats, savedThreats, favorites, notifications, loading } = data;
    const unreadCount = notifications.filter(n => !n.read).length;

    const criticalCount  = threats.filter(t => t.severity === 'critical').length;
    const highCount      = threats.filter(t => t.severity === 'high').length;
    const mediumCount    = threats.filter(t => t.severity === 'medium').length;
    const lowCount       = threats.filter(t => t.severity === 'low').length;
    const totalCount     = threats.length;

    const threatSparkline  = buildSparkline(threats);
    const savedSparkline   = buildSparkline(savedThreats);
    const flatLine         = Array.from({ length: 8 }, () => ({ value: 5 }));

    const avgConf = threats.length
        ? Math.round(threats.reduce((sum, t) => sum + (t.confidenceScore ?? 75), 0) / threats.length)
        : 0;

    // Severity breakdown percentages
    const sevBreakdown = [
        { label: 'Critical', count: criticalCount, color: 'bg-red-500' },
        { label: 'High', count: highCount, color: 'bg-orange-500' },
        { label: 'Medium', count: mediumCount, color: 'bg-amber-500' },
        { label: 'Low', count: lowCount, color: 'bg-emerald-500' },
    ];

    // Recent 4 incidents for the table
    const recentIncidents = threats.slice(0, 4);

    // Last scan time
    const lastScanLabel = threats.length && threats[0]?.timestamp
        ? formatDistanceToNow(new Date(threats[0].timestamp), { addSuffix: true })
        : 'N/A';

    if (status === "loading") {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-200">

            {/* ── TOP NAVBAR ─────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 lg:px-10 bg-[var(--card-bg)] border-b border-[var(--glass-border)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                        <Shield size={20} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-[var(--foreground)] tracking-tight text-lg hidden sm:block">
                        CYBER<span className="text-indigo-500">SENTINEL</span>
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live data refresh badge */}
                    {data.lastFetched && (
                        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            LIVE · {formatDistanceToNow(data.lastFetched, { addSuffix: true })}
                        </div>
                    )}

                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                        title="Refresh dashboard data"
                    >
                        <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <div className="hidden lg:block text-right mr-1">
                        <p className="text-sm font-bold text-[var(--foreground)] tabular-nums leading-none">
                            {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-none mt-0.5">
                            {mounted ? currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--- --'}
                        </p>
                    </div>

                    {/* Timeframe Toggle */}
                    <div className="hidden sm:flex bg-[var(--background)]/50 p-1 rounded-xl border border-[var(--glass-border)] ml-2">
                        <button
                            onClick={() => setTimeframe('7d')}
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${timeframe === '7d' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                        >
                            7D
                        </button>

                        <button
                            onClick={() => setTimeframe('all')}
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${timeframe === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                        >
                            ALL
                        </button>
                    </div>

                    {/* Notifications Dropdown */}
                    <div className="relative" ref={notificationsRef}>
                        <button 
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={`relative p-2 transition-colors rounded-xl ${isNotificationsOpen ? 'bg-indigo-500/10 text-indigo-500' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 sm:w-80 sm:mt-0.5 mt-6 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                                >
                                    <div className="px-5 py-5 border-b border-[var(--glass-border)] bg-indigo-500/5 flex items-center justify-between">
                                        <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                                            <Bell size={14} className="text-indigo-500" /> Notifications
                                        </h3>
                                        {notifications.length > 0 && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); clearNotifications(); }}
                                                className="text-[9px] font-bold text-indigo-500 uppercase hover:underline"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-indigo-500/20">
                                        {/* Maintenance Notification */}
                                        {(maintenanceNews?.isMaintenanceMode || maintenanceNews?.maintenanceStart) && (
                                            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-2.5 mb-1">
                                                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 h-fit">
                                                    <AlertCircle size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">System Maintenance</p>
                                                    <p className="text-[9px] text-[var(--foreground)] mt-0.5 leading-tight">
                                                        {maintenanceNews.maintenanceMessage || "Scheduled security upgrades are incoming."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Messenger Notifications */}
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div 
                                                    key={n._id}
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={`p-2 rounded-xl border transition-all cursor-pointer group ${n.read ? 'bg-transparent border-transparent opacity-60' : 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30'}`}
                                                >
                                                    <div className="flex gap-2.5">
                                                        <div className={`p-1.5 rounded-lg h-fit ${n.read ? 'bg-[var(--glass-bg)] text-[var(--text-muted)]' : 'bg-indigo-500/20 text-indigo-500'}`}>
                                                            <MessageSquare size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <p className={`text-[10px] font-bold uppercase tracking-tighter ${n.read ? 'text-[var(--text-muted)]' : 'text-indigo-500'}`}>
                                                                    {n.title}
                                                                </p>
                                                                <span className="text-[8px] text-[var(--text-muted)] tabular-nums">
                                                                    {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true }).replace('about ', '')}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-[var(--foreground)] mt-0.5 leading-tight line-clamp-1">
                                                                {n.message}
                                                            </p>
                                                            {n.channelId && (
                                                                <p className="text-[7px] font-mono text-[var(--text-dim)] mt-0.5 uppercase">
                                                                    Channel: {n.channelId.substring(0, 8)}...
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : !maintenanceNews?.isMaintenanceMode && !maintenanceNews?.maintenanceStart && (
                                            <div className="py-8 text-center text-[var(--text-muted)]">
                                                <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Systems Nominal</p>
                                                <p className="text-[10px] mt-1 italic">No active alerts detected.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <ThemeToggle />
                    <div className="w-px h-6 bg-[var(--glass-border)]" />

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <div 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-xl transition-all ${isProfileOpen ? 'bg-[var(--glass-bg)] ring-1 ring-[var(--glass-border)]' : 'hover:bg-[var(--glass-bg)]'}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                <User size={16} className="text-white" />
                            </div>
                            <div className="hidden md:block">
                                <p className="text-xs font-bold text-[var(--foreground)] leading-none">{session?.user?.name?.split(' ')[0] || 'Agent'}</p>
                                <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-none mt-0.5">{(session?.user as any)?.role || 'User'}</p>
                            </div>
                            <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </div>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-64 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                                >
                                    <div className="p-4 bg-indigo-500/5 border-b border-[var(--glass-border)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                                {session?.user?.name?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-[var(--foreground)] truncate">{session?.user?.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] truncate italic">{session?.user?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button 
                                            onClick={() => {
                                                setIsPasswordModalOpen(true);
                                                setIsProfileOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-500/5 transition-colors group"
                                        >
                                            <div className="p-1.5 rounded-lg bg-[var(--glass-bg)] text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors">
                                                <Key size={15} />
                                            </div>
                                            <span className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider text-left">Change Password</span>
                                        </button>
                                        <button 
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/5 text-red-500 transition-colors group"
                                        >
                                            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                                                <LogOut size={15} />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-wider">Log Out</span>
                                        </button>
                                    </div>
                                    <div className="px-4 py-2 bg-[var(--glass-bg)] flex items-center justify-between">
                                        <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Active Status</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10B981]" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-500/20 bg-red-500/5 rounded-xl hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </header>

            {/* ── MAIN ───────────────────────────────────────── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-20 pb-28 md:pt-24 md:pb-8 space-y-4 md:space-y-6">

                {/* Error Banner */}
                {data.error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm font-medium">
                        <AlertTriangle size={16} /> {data.error}
                    </div>
                )}

                {/* Row 1: KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title={`Threats (${timeframe === '7d' ? '7 days' : timeframe === '30d' ? '30 days' : 'Historical All'})`} value={totalCount}
                        trend={totalCount > 0 ? `+${totalCount}` : '—'}
                        icon={ShieldAlert} iconBg="bg-red-500/10 text-red-500"
                        data={threatSparkline} loading={loading}
                    />
                    <KPICard
                        title="Critical / High" value={`${criticalCount} / ${highCount}`}
                        trend={criticalCount > 0 ? `${criticalCount} crit` : '—'}
                        icon={AlertTriangle} iconBg="bg-orange-500/10 text-orange-500"
                        data={flatLine} loading={loading}
                    />
                    <SplitKPICard
                        items={[
                            { title: "Saved Threats", value: savedThreats.length, icon: Star, iconBg: "bg-amber-500/10 text-amber-500" },
                            { title: "Favourite Chats", value: favorites.length, icon: MessageSquare, iconBg: "bg-indigo-500/10 text-indigo-500" }
                        ]}
                        loading={loading}
                    />
                    <KPICard
                        title="Avg. Confidence" value={`${avgConf}%`}
                        trend={avgConf >= 80 ? `+High` : avgConf >= 50 ? `Medium` : `-Low`}
                        icon={Cpu} iconBg="bg-emerald-500/10 text-emerald-500"
                        data={flatLine.map(() => ({ value: avgConf }))} loading={loading}
                    />
                </div>

                {/* Row 2: Security Score + Severity Breakdown + Recent Incidents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Security Score */}
                    <Card className="p-6 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest mb-1">Security Score</p>
                        <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
                            Avg. Confidence
                        </p>
                        <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90 p-1" viewBox="0 0 100 100">
                                <defs>
                                    <filter id="score-glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                    <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#4F46E5" />
                                        <stop offset="100%" stopColor="#818CF8" />
                                    </linearGradient>
                                </defs>
                                <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--glass-border)" strokeWidth="6" strokeDasharray="264" />
                                <circle
                                    cx="50" cy="50" r="42" fill="transparent" stroke="url(#score-gradient)" strokeWidth="7"
                                    strokeDasharray="264"
                                    strokeDashoffset={loading ? 132 : 264 - (264 * (avgConf / 100))}
                                    strokeLinecap="round"
                                    filter="url(#score-glow)"
                                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                                />
                            </svg>
                            <div className="text-center relative z-10 transition-transform duration-500 hover:scale-110">
                                {loading ? (
                                    <Skeleton className="w-10 h-8 mx-auto" />
                                ) : (
                                    <>
                                        <p className="text-4xl font-black text-[var(--foreground)] tracking-tight">{avgConf}</p>
                                        <p className={`text-[8px] font-black uppercase tracking-[0.3em] mt-1 px-2 py-0.5 rounded-full border ${
                                            avgConf >= 80 ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : 
                                            avgConf >= 50 ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' : 
                                            'text-red-500 border-red-500/30 bg-red-500/5'
                                        }`}>
                                            {avgConf >= 80 ? 'SECURE' : avgConf >= 50 ? 'WARNED' : 'CRITICAL'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 w-full mt-5">
                            <div className="p-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-center">
                                <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mb-1">Sources</p>
                                <p className="text-[11px] font-black text-[var(--foreground)]">
                                    {loading ? '—' : [...new Set(threats.map(t => t.sourceType))].length}
                                </p>
                            </div>
                            <div className="p-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-center">
                                <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase mb-1">Last Feed</p>
                                <p className="text-[11px] font-black text-[var(--foreground)] truncate">
                                    {loading ? '—' : lastScanLabel.replace('about ', '').replace(' ago', 'ago')}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Severity Breakdown */}
                    <Card className="p-6 flex flex-col shadow-sm">
                        <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest mb-5">Severity Breakdown</p>
                        <div className="space-y-3 flex-1">
                            {sevBreakdown.map((c) => {
                                const pct = totalCount ? Math.round((c.count / totalCount) * 100) : 0;
                                return (
                                    <div key={c.label}>
                                        <div className="flex justify-between text-[10px] font-bold mb-1.5 px-0.5">
                                            <span className="text-[var(--text-muted)] uppercase tracking-wider">{c.label}</span>
                                            <span className="text-[var(--foreground)] font-mono">{loading ? '—' : `${c.count} (${pct}%)`}</span>
                                        </div>
                                        <div className="h-2 bg-[var(--glass-border)]/50 rounded-full overflow-hidden relative border border-[var(--glass-white)]/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                                            {!loading && (
                                                <>
                                                    <div
                                                        className={`h-full rounded-full relative transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.2)] ${
                                                            c.label === 'Critical' ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' :
                                                            c.label === 'High'     ? 'bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                                                            c.label === 'Medium'   ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                                                     'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                        }`}
                                                        style={{ width: `${pct}%`, transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                                                    >
                                                        {/* Head Indicator */}
                                                        {pct > 0 && (
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex justify-between text-[10px] font-bold">
                            <span className="text-[var(--text-muted)] uppercase">Total Threats</span>
                            <span className="text-[var(--foreground)]">{loading ? '—' : totalCount}</span>
                        </div>
                    </Card>

                    {/* Saved Threats */}
                    <Card className="p-6 flex flex-col shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={13} className="text-indigo-500" /> Saved Threats
                            </p>
                            <button 
                                onClick={() => setSavedThreatPopup(true)}
                                className="text-[9px] text-indigo-500 hover:text-indigo-400 font-bold uppercase tracking-widest transition-colors"
                            >
                                {loading ? '—' : `View All (${savedThreats.length})`}
                            </button>
                        </div>
                        <div className="divide-y divide-[var(--glass-border)]/40 flex-1">
                            {loading ? (
                                Array.from({ length: 3 }, (_, i) => (
                                    <div key={i} className="py-2.5 flex items-center gap-2">
                                        <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                                        <Skeleton className="h-3 flex-1" />
                                    </div>
                                ))
                            ) : savedThreats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-[var(--text-muted)]">
                                    <BookOpen size={22} className="mb-2 opacity-40" />
                                    <p className="text-xs font-bold">No saved threats yet</p>
                                </div>
                            ) : (
                                savedThreats.slice(0, 5).map((t, i) => (
                                    <button 
                                        key={t.id || i} 
                                        onClick={() => setSelectedThreat(t)}
                                        className="w-full flex items-center gap-2.5 py-2.5 hover:bg-indigo-500/5 group transition-all text-left"
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                            t.severity === 'critical' ? 'bg-red-500' :
                                            t.severity === 'high'     ? 'bg-orange-500' :
                                            t.severity === 'medium'   ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} />
                                        <span className="text-xs font-medium text-[var(--foreground)] truncate group-hover:text-indigo-500 transition-colors flex-1">{t.title}</span>
                                        <ChevronRight size={10} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Favourite Chats */}
                    <Card className="p-6 flex flex-col shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                                <Star size={13} className="text-amber-500" /> Fav Chats
                            </p>
                            <button 
                                onClick={() => setFavPopup(true)}
                                className="text-[9px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest transition-colors"
                            >
                                {loading ? '—' : `View All (${favorites.length})`}
                            </button>
                        </div>
                        <div className="divide-y divide-[var(--glass-border)]/40 flex-1">
                            {loading ? (
                                Array.from({ length: 3 }, (_, i) => (
                                    <div key={i} className="py-2.5 flex items-center gap-2">
                                        <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                                        <Skeleton className="h-3 flex-1" />
                                    </div>
                                ))
                            ) : favorites.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-[var(--text-muted)]">
                                    <Star size={22} className="mb-2 opacity-40" />
                                    <p className="text-xs font-bold">No favourite chats yet</p>
                                </div>
                            ) : (
                                favorites.slice(0, 5).map((f, i) => (
                                    <button 
                                        key={f.key || i} 
                                        onClick={() => {
                                            router.push(`/secure-messenger?key=${encodeURIComponent(f.key)}`); 
                                        }}
                                        className="w-full flex items-center gap-2.5 py-2.5 hover:bg-amber-500/5 group transition-all text-left"
                                    >
                                        <Star size={10} className="text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-medium text-[var(--foreground)] truncate group-hover:text-amber-600 transition-colors flex-1">{f.alias}</span>
                                        <ArrowUpRight size={10} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Row 3: Timeline + Rapid Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    {/* Intelligence Timeline */}
                    <Card className="lg:col-span-8 p-6 shadow-sm flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                                <Activity size={15} className="text-indigo-500" />
                                Intelligence Timeline
                            </h3>
                            <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                                {loading ? 'Loading…' : `${totalCount} events`}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent min-h-0 max-h-[480px]">
                            <div className="space-y-6 pl-4 py-2">
                                {loading ? (
                                    Array.from({ length: 4 }, (_, i) => (
                                        <div key={i} className="relative pl-6">
                                            <Skeleton className="absolute -left-[19px] top-0 w-8 h-8 rounded-full" />
                                            <Skeleton className="h-4 w-48 mb-1" />
                                            <Skeleton className="h-3 w-64" />
                                        </div>
                                    ))
                                ) : threats.slice(0, 15).map((t, i) => (
                                    <button 
                                        key={t.id || i} 
                                        onClick={() => router.push(`/?threatId=${t.id || i}`)}
                                        className="w-full flex gap-4 items-start group text-left transition-all"
                                    >
                                        <div className={`w-8 h-8 flex-shrink-0 rounded-full bg-[var(--card-bg)] border-2 border-[var(--glass-border)] flex items-center justify-center group-hover:border-indigo-500 transition-colors ${
                                            t.severity === 'critical' ? 'text-red-500' :
                                            t.severity === 'high'     ? 'text-orange-500' :
                                            t.severity === 'medium'   ? 'text-amber-500' : 'text-emerald-500'
                                        }`}>
                                            <ShieldAlert size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[var(--foreground)] group-hover:text-indigo-500 transition-colors truncate">{t.title}</p>
                                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                        Source: <span className="font-semibold">{t.source}</span> · Type: {t.sourceType}
                                                     </p>
                                                 </div>
                                                 <span className="text-[10px] text-[var(--text-muted)] font-mono ml-4 whitespace-nowrap">
                                                     {formatDistanceToNow(new Date(t.timestamp), { addSuffix: true }).replace('about ', '')}
                                                 </span>
                                             </div>
                                         </div>
                                     </button>
                                ))}
                                {!loading && threats.length === 0 && (
                                    <div className="pl-6 py-4 text-sm text-[var(--text-muted)]">No threat data available for the selected window.</div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Intelligence Radar & Rapid Actions Column */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Environment Scanner Card */}
                        <Card className="p-6 shadow-sm overflow-hidden relative min-h-[300px] bg-[var(--card-bg)] flex flex-col group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2 mb-1">
                                        <Shield size={15} className="text-indigo-500" />
                                        Environment Scanner
                                    </h3>
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">
                                        {isMobileDevice ? 'NATIVE DEVICE ANALYSIS' : 'WEB CONNECTION ANALYSIS'}
                                    </p>
                                </div>
                                <div className={`p-1.5 rounded-lg ${isMobileDevice ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    {isMobileDevice ? <Smartphone size={16} /> : <Activity size={16} />}
                                </div>
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-4">
                                <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="4" className="text-[var(--glass-border)]" />
                                        <circle
                                            cx="64" cy="64" r="60"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            className={`${isEnvScanning ? 'text-indigo-500' : envScanResult === 'clean' ? 'text-emerald-500' : 'text-[var(--glass-border)]'} transition-all duration-300`}
                                            strokeDasharray="377"
                                            strokeDashoffset={377 - (377 * envScanProgress) / 100}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        {isEnvScanning ? (
                                            <span className="text-2xl font-black text-indigo-500">{Math.floor(envScanProgress)}%</span>
                                        ) : envScanResult === 'clean' ? (
                                            <Shield className="text-emerald-500" size={32} />
                                        ) : envScanResult === 'warning' ? (
                                            <AlertTriangle className="text-amber-500" size={32} />
                                        ) : (
                                            <button
                                                onClick={runEnvScan}
                                                className="w-14 h-14 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-110 hover:bg-indigo-600 transition-all cursor-pointer"
                                            >
                                                <Target size={24} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {isEnvScanning && (
                                        <motion.div 
                                            animate={{ rotate: 360 }} 
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-dashed border-indigo-500/50 rounded-full" 
                                        />
                                    )}
                                </div>
                                
                                <div className="text-center flex flex-col items-center justify-center w-full px-4 min-h-[40px]">
                                    {isEnvScanning ? (
                                        <p className="text-[10px] font-mono text-indigo-400 animate-pulse uppercase tracking-widest text-center w-full">
                                            {isMobileDevice ? '> SCANNING DEVICE CORE & FILESYSTEM...' : '> ANALYZING SSL & WSS STREAMS...'}
                                        </p>
                                    ) : envScanResult ? (
                                        <div className="w-full text-left space-y-1.5 mt-2">
                                            <p className={`text-xs font-bold uppercase tracking-widest text-center mb-3 ${
                                                envScanResult === 'clean' ? 'text-emerald-500' : 
                                                envScanResult === 'warning' ? 'text-amber-500' : 'text-red-500'
                                            }`}>
                                                {envScanResult === 'clean' ? 'ENVIRONMENT VERIFIED' : 
                                                 envScanResult === 'warning' ? 'GLOBAL THREAT ACTIVE' : 'THREAT DETECTED'}
                                            </p>
                                            {envMeasures && (
                                                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-[var(--glass-border)] pt-3">
                                                    {envMeasures.isMobile ? (
                                                        <>
                                                            <div className="flex justify-between items-center bg-[var(--glass-bg)] p-1.5 rounded">
                                                                <span className="text-[var(--text-muted)]">Target Device:</span>
                                                                <span className="text-[var(--foreground)] truncate max-w-[80px]">{envMeasures.deviceModel}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-[var(--glass-bg)] p-1.5 rounded">
                                                                <span className="text-[var(--text-muted)]">Malware Scan:</span>
                                                                <span className={envMeasures.malwareScan === 'Clean' ? 'text-emerald-500' : 'text-red-500'}>{envMeasures.malwareScan}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-[var(--glass-bg)] p-1.5 rounded">
                                                                <span className="text-[var(--text-muted)]">Cyber Attacks:</span>
                                                                <span className={envMeasures.networkAttacks === 'None Detected' ? 'text-emerald-500' : 'text-amber-500'}>{envMeasures.networkAttacks}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-[var(--glass-bg)] p-1.5 rounded">
                                                                <span className="text-[var(--text-muted)]">Data Leaks:</span>
                                                                <span className={envMeasures.dataLeaks === 'Secured' ? 'text-emerald-500' : 'text-red-500'}>{envMeasures.dataLeaks}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex justify-between items-center bg-[var(--glass-bg)] p-1.5 rounded">
                                                                <span className="text-[var(--text-muted)]">Private Connection:</span>
                                                                <span className={envMeasures.secureContext ? 'text-emerald-500' : 'text-red-500'}>{envMeasures.secureContext ? 'Yes' : 'No'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-[var(--glass-bg)] p-1.5 rounded">
                                                                <span className="text-[var(--text-muted)]">Real User Verified:</span>
                                                                <span className={!envMeasures.isBot ? 'text-emerald-500' : 'text-red-500'}>{!envMeasures.isBot ? 'Yes' : 'No'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-[var(--glass-bg)] p-1.5 rounded">
                                                                <span className="text-[var(--text-muted)]">Local Data Ready:</span>
                                                                <span className={envMeasures.cookiesEnabled ? 'text-emerald-500' : 'text-red-500'}>{envMeasures.cookiesEnabled ? 'Yes' : 'No'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-[var(--glass-bg)] p-1.5 rounded">
                                                                <span className="text-[var(--text-muted)]">Intel Status:</span>
                                                                <span className={envMeasures.intelAlert ? 'text-amber-500' : 'text-emerald-500'}>
                                                                    {envMeasures.intelAlert ? 'High Alert' : 'Normal'}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest cursor-pointer hover:text-[var(--foreground)] transition-colors" onClick={runEnvScan}>
                                            INITIATE SCAN
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Rapid Actions */}
                        <Card className="p-6 flex flex-col shadow-sm">
                        <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Zap size={15} className="text-indigo-500" />
                            Rapid Actions
                        </h3>
                         <div className="grid grid-cols-2 gap-4 flex-1">
                             {[
                                 { label: "Saved Threats", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10", glow: "shadow-[0_0_15px_rgba(99,102,241,0.3)]", action: () => setSavedThreatPopup(true) },
                                 { label: "Favourites", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]", action: () => setFavPopup(true) },
                             ].map((a, i) => (
                                 <button
                                     key={i}
                                     onClick={a.action}
                                     className="p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] flex flex-col items-center justify-center gap-3 hover:border-indigo-500/50 hover:bg-[var(--card-bg)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                                 >
                                     <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform" />
                                     <div className={`p-3 rounded-xl ${a.bg} ${a.color} ${a.glow} transition-transform group-hover:scale-110`}>
                                         <a.icon size={22} />
                                     </div>
                                     <span className="text-[10px] font-black text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors text-center uppercase tracking-[0.15em]">
                                         {a.label}
                                     </span>
                                 </button>
                             ))}
                         </div>
                    </Card>
                </div>
            </div>



            {/* ── SAVED THREATS POPUP ────────────────────── */}
            {savedThreatPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSavedThreatPopup(false)}>
                    <div
                        className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl w-full max-w-xl shadow-2xl h-[500px] md:h-[600px] max-h-[85vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
                            <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                <BookOpen size={15} className="text-indigo-500" /> Saved Threats
                                <span className="ml-1 text-[10px] text-[var(--text-muted)] font-bold">{savedThreats.length} saved</span>
                            </p>
                            <button onClick={() => setSavedThreatPopup(false)} className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        {/* List */}
                        <div className="overflow-y-auto flex-1 divide-y divide-[var(--glass-border)]">
                            {savedThreats.length === 0 ? (
                                <div className="py-10 text-center text-[var(--text-muted)]">
                                    <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-xs font-bold">No saved threats yet</p>
                                </div>
                            ) : (
                                savedThreats.map((t, i) => (
                                    <button
                                        key={t.id || i}
                                        onClick={() => { setSelectedThreat(t); setSavedThreatPopup(false); }}
                                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--glass-bg)] transition-colors text-left group"
                                    >
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            t.severity === 'critical' ? 'bg-red-500' :
                                            t.severity === 'high'     ? 'bg-orange-500' :
                                            t.severity === 'medium'   ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-indigo-500 transition-colors">{t.title}</p>
                                            <p className="text-[10px] text-[var(--text-muted)] capitalize">{t.severity} · {t.source}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── FAV CHATS POPUP ────────────────────────── */}
            {favPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setFavPopup(false)}>
                    <div
                        className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl w-full max-w-xl shadow-2xl h-[600px] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
                            <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                <Star size={15} className="text-amber-500" /> Favourite Chats
                                <span className="ml-1 text-[10px] text-[var(--text-muted)] font-bold">{favorites.length} saved</span>
                            </p>
                            <button onClick={() => setFavPopup(false)} className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        {/* List */}
                        <div className="overflow-y-auto flex-1 divide-y divide-[var(--glass-border)]">
                            {favorites.length === 0 ? (
                                <div className="py-10 text-center text-[var(--text-muted)]">
                                    <Star size={28} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-xs font-bold">No favourite chats yet</p>
                                </div>
                            ) : (
                                    favorites.map((f, i) => (
                                        <button
                                            key={f.key || i}
                                            onClick={() => { 
                                                setFavPopup(false); 
                                                const tag = f.platform === 'app' ? '' : `&tag=${f.platform}`;
                                                router.push(`/secure-messenger?key=${encodeURIComponent(f.key)}${tag}`); 
                                            }}
                                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--glass-bg)] transition-colors text-left group"
                                        >
                                            <div className="flex-shrink-0 relative">
                                                <Star size={13} className="text-amber-500" fill="currentColor" />
                                                {f.platform && f.platform !== 'app' && (
                                                    <span className={`absolute -top-2 -right-2 text-[6px] px-1 rounded-full font-bold uppercase border ${
                                                        f.platform === 'whatsapp' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                                        f.platform === 'instagram' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 
                                                        'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                                    }`}>
                                                        {f.platform[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-amber-500 transition-colors">{f.alias}</p>
                                                    {f.platform && f.platform !== 'app' && (
                                                        <span className="text-[8px] text-[var(--text-muted)] opacity-50 uppercase tracking-tighter">via {f.platform}</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">{f.key.substring(0, 16)}…</p>
                                            </div>
                                            <ChevronRight size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                                        </button>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── PASSWORD CHANGE MODAL ──────────────────────── */}
            <AnimatePresence>
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                            
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                            <Lock size={20} className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tighter text-[var(--foreground)]">Security Protocol</h3>
                                            <p className="text-[10px] text-[var(--text-dim)] font-mono">STEP {modalStep === 'verify' ? '01' : '02'}_OF_02</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setIsPasswordModalOpen(false);
                                            setModalStep('verify');
                                            setOldPassword('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                            setPasswordError('');
                                            setPasswordSuccess(false);
                                        }}
                                        className="p-2 hover:bg-[var(--glass-bg)] rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-[var(--text-muted)]" />
                                    </button>
                                </div>

                                {passwordSuccess ? (
                                    <div className="text-center py-6">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                            <CheckCircle className="text-emerald-500" size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-[var(--foreground)] mb-2 uppercase italic tracking-tight">Access updated</h4>
                                        <p className="text-xs text-[var(--text-muted)] mb-8">Your security credentials have been successfully recalibrated. Use your new password for future sessions.</p>
                                        <button 
                                            onClick={() => setIsPasswordModalOpen(false)}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20"
                                        >
                                            Dismiss Terminal
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {modalStep === 'verify' ? (
                                            <div className="space-y-4">
                                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">Please verify your identity by entering your current terminal access key.</p>
                                                <div className="relative">
                                                    <input 
                                                        type="password"
                                                        value={oldPassword}
                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                        placeholder="CURRENT_PASSWORD"
                                                        className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl px-6 py-4 text-sm font-mono placeholder:text-[var(--text-dim)] focus:border-indigo-500/50 outline-none transition-all"
                                                    />
                                                    <Key size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                                                </div>
                                                <button className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Forgot password?</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">Enter your new security credentials below. Ensure they are complex and unique.</p>
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <input 
                                                            type="password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            placeholder="NEW_PASSWORD"
                                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl px-6 py-4 text-sm font-mono placeholder:text-[var(--text-dim)] focus:border-indigo-500/50 outline-none transition-all"
                                                        />
                                                        <Lock size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                                                    </div>
                                                    <div className="relative">
                                                        <input 
                                                            type="password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            placeholder="CONFIRM_NEW_PASSWORD"
                                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl px-6 py-4 text-sm font-mono placeholder:text-[var(--text-dim)] focus:border-indigo-500/50 outline-none transition-all"
                                                        />
                                                        <CheckCircle size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {passwordError && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                                            >
                                                <AlertCircle size={14} className="text-red-500 shrink-0" />
                                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{passwordError}</p>
                                            </motion.div>
                                        )}

                                        <button 
                                            onClick={async () => {
                                                setPasswordLoading(true);
                                                setPasswordError('');
                                                try {
                                                    const res = await fetch('/api/user/change-password', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ 
                                                            step: modalStep,
                                                            oldPassword,
                                                            newPassword,
                                                            confirmPassword
                                                        })
                                                    });
                                                    const data = await res.json();
                                                    if (!res.ok) throw new Error(data.message);
                                                    
                                                    if (modalStep === 'verify') {
                                                        setModalStep('update');
                                                    } else {
                                                        setPasswordSuccess(true);
                                                    }
                                                } catch (err: any) {
                                                    setPasswordError(err.message);
                                                } finally {
                                                    setPasswordLoading(false);
                                                }
                                            }}
                                            disabled={passwordLoading || (modalStep === 'verify' && !oldPassword) || (modalStep === 'update' && (!newPassword || !confirmPassword))}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-3 group"
                                        >
                                            {passwordLoading ? (
                                                <RefreshCw size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <span>{modalStep === 'verify' ? 'Initialize Verification' : 'Update Credentials'}</span>
                                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── HANDSHAKE MODAL ──────────────────────────── */}
            <AnimatePresence>
                {showHandshakeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--card-bg)] border border-indigo-500/30 rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500/50" />
                            
                            <h3 className="text-xl font-black italic uppercase text-[var(--foreground)] mb-2 flex items-center gap-2">
                                <ShieldCheck className="text-indigo-500" size={24} />
                                Secure Connection Request
                            </h3>
                            <p className="text-xs text-[var(--text-dim)] mb-6 leading-relaxed">
                                <strong>{handshakeSender}</strong> has shared a secure key to establish an encrypted channel with you.
                            </p>

                            <div className="flex gap-3 pt-2 border-t border-[var(--glass-border)]">
                                <button
                                    onClick={handleDenyHandshake}
                                    className="flex-1 py-3 rounded-xl border border-[var(--glass-border)] text-[var(--text-dim)] font-bold uppercase text-xs hover:bg-[var(--glass-bg)] transition-colors"
                                >
                                    Deny
                                </button>
                                <button
                                    onClick={handleApproveHandshake}
                                    disabled={isProcessingHandshake}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase text-xs hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center disabled:opacity-50"
                                >
                                    {isProcessingHandshake ? <RefreshCw size={16} className="animate-spin" /> : 'Approve & Connect'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── THREAT DETAIL MODAL ─────────────────────── */}
            <ThreatDetailModal
                threat={selectedThreat as any}
                isOpen={!!selectedThreat}
                onClose={() => setSelectedThreat(null)}
            />

            </main>
        </div>
    );
}
