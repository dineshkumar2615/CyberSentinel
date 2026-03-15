'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Zap, Activity, Cpu, Terminal, Bell, Lock, AlertTriangle, CheckCircle2, ChevronRight, ArrowUpRight, Signal, Settings, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// --- DATA & TYPES ---

interface LogEntry {
    id: number;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'CRIT';
    message: string;
}

const INITIAL_LOGS: LogEntry[] = [
    { id: 1, timestamp: '08:42:15', level: 'INFO', message: 'INTELLIGENCE_CORE_SYNCHRONIZED' },
    { id: 2, timestamp: '08:42:16', level: 'INFO', message: 'FIREWALL_RULESET_OPTIMIZED' },
    { id: 3, timestamp: '08:42:18', level: 'INFO', message: 'SCANNING_LOCAL_NETWORK_NODES...' },
];

const ACTIONS = [
    { id: 1, title: 'Archive Review Required', desc: 'Complete 2 pending technical dossiers.', action: 'Review dossiers', priority: 'MEDIUM' },
    { id: 2, title: 'Insecure Protocol Detected', desc: 'Found unencrypted legacy port open.', action: 'Isolate port', priority: 'HIGH' },
    { id: 3, title: 'System Core Audit', desc: 'Manual scan recommended for deep analysis.', action: 'Run scan', priority: 'LOW' },
];

// --- COMPONENTS ---

const GradeGauge = ({ score }: { score: number }) => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full border border-neon-blue/10 animate-ping opacity-20" />

            <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-white/5"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-neon-blue drop-shadow-[0_0_15px_rgba(0,210,255,0.5)]"
                    strokeLinecap="round"
                />
            </svg>

            <div className="absolute flex flex-col items-center">
                <span className="text-6xl font-black italic tracking-tighter text-white">
                    {score < 90 ? 'B+' : 'A'}
                </span>
                <span className="text-[10px] font-mono text-neon-blue tracking-widest uppercase mt-1">SENTINEL_GRADE</span>
            </div>

            {/* Orbiting Tech Bits */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[15%] pointer-events-none"
            >
                <div className="w-2 h-2 bg-neon-blue rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_10px_#00d2ff]" />
            </motion.div>
        </div>
    );
};

const LiveLog = ({ activeThreats }: { activeThreats: any[] }) => {
    const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
    const logScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeThreats.length > 0) {
            const latestThreat = activeThreats[0];
            const newLog: LogEntry = {
                id: Date.now(),
                timestamp: new Date().toTimeString().split(' ')[0],
                level: latestThreat.severity === 'critical' ? 'CRIT' : latestThreat.severity === 'high' ? 'WARN' : 'INFO',
                message: latestThreat.title.toUpperCase()
            };
            setLogs(prev => [...prev.slice(-15), newLog]);
        }
    }, [activeThreats]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timestamp = now.toTimeString().split(' ')[0];
            const messages = [
                'ENCRYPTING_METADATA_STREAM...',
                'HEURISTIC_ENGINE_ACTIVE',
                'HEARTBEAT_SIGNAL_STABLE',
                'DATABASE_INJECTION_SHIELD_ACTIVE'
            ];
            const newLog: LogEntry = {
                id: Date.now() + Math.random(),
                timestamp,
                level: 'INFO',
                message: messages[Math.floor(Math.random() * messages.length)]
            };
            setLogs(prev => [...prev.slice(-15), newLog]);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (logScrollRef.current) logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }, [logs]);

    return (
        <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--glass-border)] flex flex-col h-full overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-neon-blue" />
                    <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">Defensive_Ops_Stream</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-[8px] font-mono text-neon-green/60 uppercase">ACTIVE</span>
                </div>
            </div>
            <div
                ref={logScrollRef}
                className="flex-1 p-6 font-mono text-[10px] space-y-2 overflow-y-auto scrollbar-hide"
            >
                {logs.map(log => (
                    <div key={log.id} className="flex gap-4 group">
                        <span className="text-[var(--text-dim)] opacity-40">[{log.timestamp}]</span>
                        <span className={`font-bold ${log.level === 'WARN' ? 'text-amber-500' : log.level === 'CRIT' ? 'text-neon-red' : 'text-neon-blue'}`}>
                            {log.level}
                        </span>
                        <span className="text-[var(--text-dim)] group-hover:text-[var(--foreground)] transition-colors uppercase truncate">
                            {log.message}
                        </span>
                    </div>
                ))}
                <div className="animate-pulse text-neon-blue">_</div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

export default function SOCDashboard() {
    const [threats, setThreats] = useState<any[]>([]);
    const [stats, setStats] = useState({ integrity: 98, quota: 64, resilience: 82 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/threats');
                if (res.ok) {
                    const data = await res.json();
                    setThreats(data);

                    // Calculate dynamic resilience based on threat count (higher count = lower resilience)
                    const calculatedResilience = Math.max(70, 100 - (data.length * 0.5));
                    setStats(prev => ({ ...prev, resilience: Math.round(calculatedResilience) }));
                }
            } catch (err) {
                console.error('Failed to sync SOC data:', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Sync every 30s
        return () => clearInterval(interval);
    }, []);

    // Derived Metrics
    const activeMetrics = [
        { id: 'integrity', label: 'Endpoint Integrity', value: `${stats.integrity}%`, status: 'OPTIMAL', icon: Cpu, color: 'text-neon-green' },
        { id: 'count', label: 'Active Threats', value: threats.length.toString(), status: threats.length > 50 ? 'CAUTION' : 'STABLE', icon: Activity, color: 'text-neon-blue' },
        { id: 'resilience', label: 'Threat Resilience', value: `${stats.resilience}%`, status: 'STABLE', icon: Shield, color: 'text-neon-purple' },
    ];

    return (
        <main className="min-h-screen pt-12 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-neon-blue/10 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,210,255,0.05),transparent_70%)]" />
            </div>

            <div className="relative z-10 flex flex-col h-full">

                {/* Refractive SOC Portal (Header v5) */}
                <header className="w-full mb-12 sticky top-0 bg-[var(--background)]/60 backdrop-blur-2xl z-30 border-b border-[var(--glass-border)] rounded-b-[2.5rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
                    {/* Scanning Laser Animation */}
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-0 h-[1px] w-56 bg-gradient-to-r from-transparent via-neon-blue to-transparent filter blur-[1px] opacity-70"
                    />

                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 group cursor-pointer mx-auto md:mx-0">
                            <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,210,255,0.15)]">
                                <ShieldAlert size={24} />
                            </div>
                            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-[var(--foreground)] uppercase leading-none">
                                    Alert <span className="text-neon-blue">Center</span>
                                </h1>
                                <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.25em] mt-1.5 opacity-60">Security_Ops // ALPHA_NODE</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-neon-blue/5 border border-neon-blue/20 rounded-xl flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                                <span className="text-[10px] font-black text-neon-green uppercase tracking-widest">Live_Secure</span>
                            </div>
                            <button className="px-5 py-2.5 bg-[var(--foreground)] text-[var(--background)] font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                                Export_Audit
                            </button>
                        </div>
                    </div>
                </header>

                {/* 1. Monitoring Core with Grade */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    <div className="lg:col-span-8 flex flex-col md:flex-row items-center gap-12 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[3rem] p-10 relative overflow-hidden">
                        <GradeGauge score={Math.min(98, 90 + (threats.length / 5))} />
                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <div>
                                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-2">
                                    SENTINEL <span className="text-neon-blue">SOC</span>
                                </h1>
                                <p className="text-[var(--text-dim)] font-mono text-xs tracking-widest uppercase">Operations_Monitoring // Node_Alpha_01</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                    <div className="text-[9px] text-[var(--text-dim)] font-bold uppercase tracking-widest mb-1">Defense Level</div>
                                    <div className="text-xl font-black text-neon-green">MAXIMUM</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                    <div className="text-[9px] text-[var(--text-dim)] font-bold uppercase tracking-widest mb-1">Alert Count</div>
                                    <div className="text-xl font-black text-[var(--foreground)]">{threats.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 h-full">
                        <LiveLog activeThreats={threats.slice(0, 5)} />
                    </div>
                </section>

                {/* 2. Metrics & Actions Grid */}
                <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                    {/* Left: Metrics */}
                    <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {activeMetrics.map(metric => (
                            <motion.div
                                key={metric.id}
                                whileHover={{ y: -5 }}
                                className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-3xl p-8 group relative overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`p-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] transition-colors group-hover:border-neon-blue/30`}>
                                        <metric.icon size={24} className={metric.color} />
                                    </div>
                                    <div className="text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                                        STS: {metric.status}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black mb-1">{metric.value}</div>
                                    <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest">{metric.label}</div>
                                </div>
                                <div className="absolute bottom-4 right-4 text-[var(--foreground)]/5 group-hover:text-neon-blue/20 transition-colors">
                                    <ArrowUpRight size={40} />
                                </div>
                            </motion.div>
                        ))}

                        {/* Large Actionable HUD Element */}
                        <div className="md:col-span-3 bg-neon-blue/5 border border-neon-blue/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="w-24 h-24 rounded-full bg-neon-blue/10 flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full border border-neon-blue animate-pulse" />
                                <ShieldAlert size={40} className="text-neon-blue" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Automated Threat Containment</h3>
                                <p className="text-[var(--text-dim)] text-sm font-medium mb-6">Heuristic agents are monitoring {threats.length} active data streams to preemptively isolate malware clusters.</p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[10px] font-mono text-neon-green">
                                        <Signal size={14} /> HEURISTICS: ACTIVE
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[10px] font-mono text-neon-blue">
                                        <Lock size={14} /> ENCRYPTION: OPTIMIZED
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="xl:col-span-4 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-2 mb-8">
                            <Bell className="text-neon-purple font-black" size={20} />
                            <h2 className="text-xl font-black italic tracking-tighter uppercase">Recommended_Actions</h2>
                        </div>
                        <div className="space-y-4">
                            {ACTIONS.map(action => (
                                <div key={action.id} className="p-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-white/10 transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded leading-none ${action.priority === 'HIGH' ? 'bg-neon-red text-black' : 'bg-neon-blue/20 text-neon-blue'
                                            }`}>
                                            {action.priority}_PRIORITY
                                        </div>
                                        <div className="text-[var(--text-dim)] group-hover:text-neon-blue transition-colors">
                                            <AlertTriangle size={14} />
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-[var(--foreground)] mb-1 group-hover:text-neon-blue transition-colors">{action.title}</h4>
                                    <p className="text-xs text-[var(--text-dim)] mb-6">{action.desc}</p>
                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neon-blue group-hover:gap-4 transition-all">
                                        {action.action} <ChevronRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </section>
            </div>

            {/* Global HUD elements */}
            <div className="fixed bottom-0 left-0 p-8 z-40">
                <div className="font-mono text-[9px] text-[var(--text-muted)] space-y-1">
                    <div>SOC_ID: CS-ALPHA-42</div>
                    <div>LATENCY: 12ms</div>
                </div>
            </div>
        </main>
    );
}
