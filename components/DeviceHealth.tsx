'use client';
import { useState } from 'react';
import { runDeviceHealthCheck, HealthCheckResult, HealthCategory } from '@/lib/device-check';
import {
    ShieldCheck,
    Activity,
    Lock,
    Cpu,
    Network,
    Fingerprint,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    Info,
    Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DeviceHealth({ hideHeader = false }: { hideHeader?: boolean }) {
    const { status } = useSession();
    const router = useRouter();
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState<HealthCheckResult[] | null>(null);
    const [score, setScore] = useState(100);
    const [scanProgress, setScanProgress] = useState(0);

    const getMetricValue = (label: string) => {
        if (!results) return 'Pending';
        switch (label) {
            case 'Firewall':
                const adblock = results.find(r => r.id === 'adblock');
                return adblock?.status === 'safe' ? 'Engaged' : 'Limited';
            case 'Memory':
                const mem = results.find(r => r.id === 'memory_real');
                return mem ? mem.details.split(' ')[0] : 'Detecting';
            case 'Latency':
                const lat = results.find(r => r.id === 'latency');
                return lat ? lat.details.split(' ')[0] : 'Testing';
            default:
                return 'N/A';
        }
    };

    const metrics = [
        { label: 'Firewall', value: getMetricValue('Firewall'), icon: Lock, color: 'text-emerald-600 dark:text-emerald-500' },
        { label: 'Memory', value: getMetricValue('Memory'), icon: Cpu, color: 'text-blue-600 dark:text-blue-500' },
        { label: 'Latency', value: getMetricValue('Latency'), icon: Activity, color: 'text-indigo-600 dark:text-indigo-500' },
    ];

    const startScan = async () => {
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        setScanning(true);
        setResults(null);
        setScanProgress(0);

        const progressInterval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 98) {
                    clearInterval(progressInterval);
                    return 98;
                }
                return prev + (Math.random() * 5);
            });
        }, 100);

        const data = await runDeviceHealthCheck();

        clearInterval(progressInterval);
        setScanProgress(100);

        setTimeout(() => {
            setResults(data);
            const safeCount = data.filter(r => r.status === 'safe').length;
            setScore(Math.round((safeCount / data.length) * 100));
            setScanning(false);
        }, 500);
    };

    const categories: { id: HealthCategory; icon: any; color: string }[] = [
        { id: 'Connection', icon: Network, color: 'text-blue-600 dark:text-blue-500' },
        { id: 'Privacy', icon: Fingerprint, color: 'text-purple-600 dark:text-purple-500' },
        { id: 'System', icon: Smartphone, color: 'text-emerald-600 dark:text-emerald-500' },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 h-full flex flex-col">
            {/* Compact Header & Stats */}
            {!hideHeader && (
                <div className="flex flex-col md:flex-row gap-6 mb-8 items-stretch md:h-32">
                    {/* Main Scan Control Card */}
                    <div className="flex-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-neon-blue mb-1">
                                <ShieldCheck size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">System Core Scan</span>
                            </div>
                            <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight italic mb-1">
                                SYSTEM <span className="text-zinc-500">DIAGNOSTICS</span>
                            </h1>
                            <p className="text-[var(--foreground)]/50 text-xs font-mono">
                                {scanning ? 'HEURISTIC ANALYSIS IN PROGRESS...' : results ? 'ALL SYSTEMS OPERATIONAL' : 'READY FOR DIAGNOSTICS'}
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center gap-4">
                            {/* Circle Score Indicator */}
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-[var(--glass-border)]" />
                                    <circle
                                        cx="40" cy="40" r="36"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        className={`${scanning ? 'text-neon-blue' : score > 80 ? 'text-emerald-500' : 'text-orange-500'} transition-all duration-500`}
                                        strokeDasharray="226"
                                        strokeDashoffset={226 - (226 * (scanning ? scanProgress : results ? score : 0)) / 100}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className={`text-xl font-bold ${scanning ? 'text-neon-blue' : score > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    {scanning ? Math.floor(scanProgress) : score}%
                                </span>
                            </div>

                            {!scanning && (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={startScan}
                                        className="h-14 w-14 flex items-center justify-center bg-neon-blue text-black rounded-2xl hover:scale-110 active:scale-95 transition-all group/btn shadow-[0_0_20px_rgba(0,210,255,0.3)] z-[70] border-2 border-white/20"
                                        title="Run Scan"
                                    >
                                        <RefreshCw size={24} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                                    </button>
                                    <span className="text-[8px] font-mono text-neon-blue text-center opacity-70 tracking-tighter uppercase whitespace-nowrap">Recalibrate</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Metric Cards */}
                    {metrics.map((m, i) => (
                        <div key={i} className="hidden lg:flex w-48 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-4 flex-col justify-between hover:border-[var(--foreground)]/20 transition-colors">
                            <div className={`p-2 w-fit rounded-lg bg-[var(--card-bg)] ${m.color}`}>
                                <m.icon size={20} />
                            </div>
                            <div>
                                <p className="text-[var(--foreground)]/40 text-[10px] font-bold uppercase tracking-wider">{m.label}</p>
                                <p className="text-xl font-bold text-[var(--foreground)]">{m.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dashboard Grid Results */}
            <div className="flex-1 min-h-[400px] relative bg-[var(--background)]/50 rounded-3xl border border-[var(--glass-border)] p-6 overflow-hidden">
                {!results && !scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--foreground)]/30">
                        <Activity size={64} className="mb-4 opacity-50" />
                        <p className="text-sm font-mono uppercase tracking-widest">Awaiting Analysis...</p>
                    </div>
                )}

                {scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Telemetry Pulse Effect */}
                        <div className="absolute inset-0 z-0 overflow-hidden opacity-20">
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, opacity: 0.5 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.6 }}
                                    className="absolute inset-0 border border-neon-blue rounded-full m-auto w-96 h-96"
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 lg:gap-8 w-full max-w-4xl px-4 lg:px-8 z-10">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-48 lg:h-64 bg-[var(--glass-bg)] rounded-2xl animate-pulse border border-[var(--glass-border)]" />
                            ))}
                        </div>
                        <div className="mt-8 font-mono text-neon-blue text-xs animate-pulse z-10">
                            &gt; SCANNING_SECTORS_ {scanProgress.toFixed(1)}%
                        </div>
                    </div>
                )}

                {results && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        {categories.map((cat) => {
                            const catResults = results.filter(r => r.category === cat.id);
                            return (
                                <div key={cat.id} className="flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--glass-border)]">
                                        <cat.icon size={16} className={cat.color} />
                                        <h3 className="text-sm font-bold text-[var(--foreground)]/80 uppercase tracking-wider">{cat.id}</h3>
                                        <span className="ml-auto text-[10px] font-mono bg-[var(--glass-bg)] px-2 py-0.5 rounded text-[var(--foreground)]/50">
                                            {catResults.length} CHECKS
                                        </span>
                                    </div>

                                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                                        {catResults.map((result, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={result.id}
                                                className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-3 rounded-xl hover:bg-[var(--glass-bg)] transition-colors group"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-[var(--foreground)]">{result.name}</span>
                                                    {result.status === 'safe'
                                                        ? <CheckCircle2 size={14} className="text-emerald-500" />
                                                        : <AlertTriangle size={14} className="text-orange-500" />
                                                    }
                                                </div>
                                                <p className="text-[10px] text-[var(--foreground)]/60 leading-tight mb-2">{result.details}</p>
                                                {result.action && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                                                        <Info size={10} className="text-orange-500" />
                                                        <p className="text-[9px] text-orange-500/80 font-medium">{result.action}</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
