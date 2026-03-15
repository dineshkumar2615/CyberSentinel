"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Shield, User, Key, Save, LogOut, ChevronRight, 
    CheckCircle, Smartphone, Activity, Zap, 
    Settings, Clock, ShieldAlert, AlertTriangle, Star, Cpu, 
    RefreshCw, ChevronDown, Search, MessageSquare,
    BookOpen, X, Target, Landmark, ArrowUpRight, ArrowDownRight,
    Bell, Camera
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import ThreatDetailModal from "@/components/ThreatDetailModal";
import { 
    AreaChart, Area, ResponsiveContainer
} from "recharts";
import { formatDistanceToNow } from "date-fns";

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
    addedAt: string;
}

interface DashboardData {
    threats: Threat[];
    savedThreats: Threat[];
    favorites: Favorite[];
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
                            <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke={isPositive ? '#10B981' : '#EF4444'} strokeWidth={2} fillOpacity={1} fill={`url(#g-${title})`} />
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
        loading: true,
        lastFetched: null,
        error: null,
    });

    // Popup state
    const [savedThreatPopup, setSavedThreatPopup] = useState(false);
    const [favPopup, setFavPopup] = useState(false);
    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchAll = useCallback(async () => {
        setData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const [threatsRes, savedRes, favsRes] = await Promise.all([
                fetch('/api/threats?days=7'),
                fetch('/api/users/saved-threats'),
                fetch('/api/favorites'),
            ]);
            const threats: Threat[]       = threatsRes.ok ? await threatsRes.json() : [];
            const savedThreats: Threat[]  = savedRes.ok    ? await savedRes.json()   : [];
            const favsData                = favsRes.ok      ? await favsRes.json()    : {};
            const favorites: Favorite[]   = favsData.favorites || [];

            setData({ threats, savedThreats, favorites, loading: false, lastFetched: new Date(), error: null });
        } catch (e) {
            setData(prev => ({ ...prev, loading: false, error: 'Failed to load dashboard data' }));
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Derived stats ────────────────────────────────────
    const { threats, savedThreats, favorites, loading } = data;

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
            <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 lg:px-10 bg-[var(--card-bg)] border-b border-[var(--glass-border)] backdrop-blur-xl">
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

                    <button className="relative p-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                        <Bell size={20} />
                        {criticalCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                        )}
                    </button>

                    <ThemeToggle />
                    <div className="w-px h-6 bg-[var(--glass-border)]" />

                    <div className="flex items-center gap-2 cursor-pointer hover:bg-[var(--glass-bg)] px-2 py-1.5 rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <User size={16} className="text-white" />
                        </div>
                        <div className="hidden md:block">
                            <p className="text-xs font-bold text-[var(--foreground)] leading-none">{session?.user?.name?.split(' ')[0] || 'Agent'}</p>
                            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-none mt-0.5">{(session?.user as any)?.role || 'User'}</p>
                        </div>
                        <ChevronDown size={14} className="text-[var(--text-muted)]" />
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">

                {/* Error Banner */}
                {data.error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm font-medium">
                        <AlertTriangle size={16} /> {data.error}
                    </div>
                )}

                {/* Row 1: KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Threats (7 days)" value={totalCount}
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
                            <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                                {loading ? '—' : `${savedThreats.length} saved`}
                            </span>
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
                                    <div key={t.id || i} className="flex items-center gap-2.5 py-2.5">
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                            t.severity === 'critical' ? 'bg-red-500' :
                                            t.severity === 'high'     ? 'bg-orange-500' :
                                            t.severity === 'medium'   ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} />
                                        <span className="text-xs font-medium text-[var(--foreground)] truncate">{t.title}</span>
                                    </div>
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
                            <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                                {loading ? '—' : `${favorites.length} saved`}
                            </span>
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
                                    <div key={f.key || i} className="flex items-center gap-2.5 py-2.5">
                                        <Star size={10} className="text-amber-500 flex-shrink-0" />
                                        <span className="text-xs font-medium text-[var(--foreground)] truncate">{f.alias}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Row 3: Timeline + Rapid Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Intelligence Timeline */}
                    <Card className="lg:col-span-8 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2">
                                <Activity size={15} className="text-indigo-500" />
                                Intelligence Timeline
                            </h3>
                            <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                                {loading ? 'Loading…' : `${totalCount} events`}
                            </span>
                        </div>
                        <div className="space-y-5 pl-3 border-l-2 border-[var(--glass-border)]">
                            {loading ? (
                                Array.from({ length: 4 }, (_, i) => (
                                    <div key={i} className="relative pl-6">
                                        <Skeleton className="absolute -left-[19px] top-0 w-8 h-8 rounded-full" />
                                        <Skeleton className="h-4 w-48 mb-1" />
                                        <Skeleton className="h-3 w-64" />
                                    </div>
                                ))
                            ) : threats.slice(0, 5).map((t, i) => (
                                <div key={t.id || i} className="relative pl-6 group">
                                    <div className={`absolute -left-[19px] top-0 w-8 h-8 rounded-full bg-[var(--card-bg)] border-2 border-[var(--glass-border)] flex items-center justify-center group-hover:border-indigo-500 transition-colors ${
                                        t.severity === 'critical' ? 'text-red-500' :
                                        t.severity === 'high'     ? 'text-orange-500' :
                                        t.severity === 'medium'   ? 'text-amber-500' : 'text-emerald-500'
                                    }`}>
                                        <ShieldAlert size={14} />
                                    </div>
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
                            ))}
                            {!loading && threats.length === 0 && (
                                <div className="pl-6 py-4 text-sm text-[var(--text-muted)]">No threat data available for the selected window.</div>
                            )}
                        </div>
                    </Card>

                    {/* Rapid Actions */}
                    <Card className="lg:col-span-4 p-6 flex flex-col shadow-sm">
                        <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest flex items-center gap-2 mb-6">
                            <Zap size={15} className="text-indigo-500" />
                            Rapid Actions
                        </h3>
                         <div className="grid grid-cols-2 gap-4 flex-1">
                             {[
                                 { label: "Refresh Data", icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-500/10", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]", action: fetchAll },
                                 { label: "Saved Threats", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10", glow: "shadow-[0_0_15px_rgba(99,102,241,0.3)]", action: () => setSavedThreatPopup(true) },
                                 { label: "Favourites", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]", action: () => setFavPopup(true) },
                                 { label: "System Scan", icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]", action: fetchAll },
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



            {/* ── SAVED THREATS POPUP ────────────────────── */}
            {savedThreatPopup && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSavedThreatPopup(false)}>
                    <div
                        className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl w-full max-w-xl shadow-2xl h-[600px] flex flex-col"
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
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setFavPopup(false)}>
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
                                        onClick={() => { setFavPopup(false); router.push(`/secure-messenger?key=${encodeURIComponent(f.key)}`); }}
                                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--glass-bg)] transition-colors text-left group"
                                    >
                                        <Star size={13} className="text-amber-500 flex-shrink-0" fill="currentColor" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-amber-500 transition-colors">{f.alias}</p>
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
