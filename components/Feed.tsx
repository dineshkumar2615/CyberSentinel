'use client';
import { useEffect, useState } from 'react';
import { Threat } from '@/lib/types';
import ThreatCard from './ThreatCard';
import ScannerOverlay from './ScannerOverlay';
import { RefreshCw, Shield, Search, Filter, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection from './HeroSection';
import ThreatAnalytics from './ThreatAnalytics';

type CategoryFilter = 'all' | 'malware' | 'breach' | 'vulnerability' | 'ransomware' | 'phishing';
type DateFilter = '24h' | '3d' | '7d';

export default function Feed() {
    const [threats, setThreats] = useState<Threat[]>([]);
    const [pendingThreats, setPendingThreats] = useState<Threat[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('7d');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'threat' | 'analytics'>('threat');

    const fetchThreats = async () => {
        try {
            const res = await fetch('/api/threats');
            if (res.ok) {
                const data = await res.json();
                setThreats(data.filter((t: Threat) => !t.isHidden));
                setPendingThreats([]); // Clear pending on fetch
            }
        } catch (error) {
            console.error('Failed to fetch threats', error);
        }
    };

    useEffect(() => { fetchThreats(); }, []);

    useEffect(() => {
        const eventSource = new EventSource('/api/threats/events');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'pulse') return;

            setPendingThreats((prev) => {
                const incomingId = data._id || data.id;
                if (prev.find(t => (t as any)._id === incomingId || t.id === incomingId)) return prev;
                if (threats.find(t => (t as any)._id === incomingId || t.id === incomingId)) return prev;
                return [data, ...prev];
            });
        };

        return () => {
            eventSource.close();
        };
    }, [threats]);

    const triggerScan = () => { if (!isScanning) setIsScanning(true); };

    const handleScanComplete = async () => {
        setIsScanning(false);
        await fetch('/api/threats/sync', { method: 'POST' });
        await fetchThreats();
        setLastScan(new Date().toISOString());
    };

    // Date filtering
    const dateFilteredThreats = threats.filter(t => {
        const msMap: Record<DateFilter, number> = { '24h': 86400000, '3d': 259200000, '7d': 604800000 };
        return Date.now() - new Date(t.timestamp).getTime() <= msMap[dateFilter];
    });

    // Category filtering
    const categoryMatch = (t: Threat): boolean => {
        if (categoryFilter === 'all') return true;
        const text = (t.title + ' ' + t.description).toLowerCase();
        const matches: Record<CategoryFilter, string[]> = {
            all: [],
            malware: ['malware', 'virus', 'trojan', 'worm', 'spyware'],
            breach: ['breach', 'leak', 'data exposure', 'credential'],
            vulnerability: ['vulnerability', 'exploit', 'cve', 'zero-day', 'flaw', 'patch'],
            ransomware: ['ransomware', 'ransom', 'encryption', 'decrypt'],
            phishing: ['phishing', 'phish', 'scam', 'social engineering'],
        };
        return matches[categoryFilter].some(kw => text.includes(kw));
    };

    // Search filtering
    const feedThreats = dateFilteredThreats.filter(t => {
        if (!categoryMatch(t)) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.source.toLowerCase().includes(q);
    });

    const categoryOptions: { key: CategoryFilter; label: string }[] = [
        { key: 'all', label: 'All Threats' },
        { key: 'malware', label: 'Malware' },
        { key: 'breach', label: 'Breaches' },
        { key: 'vulnerability', label: 'Vulnerabilities' },
        { key: 'ransomware', label: 'Ransomware' },
        { key: 'phishing', label: 'Phishing' },
    ];

    const dateOptions: { key: DateFilter; label: string }[] = [
        { key: '24h', label: 'Last 24h' },
        { key: '3d', label: '3 Days' },
        { key: '7d', label: '7 Days' },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">                                                                                          
            <ScannerOverlay isScanning={isScanning} onScanComplete={handleScanComplete} />

            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-[var(--card-bg)] border-b border-[var(--glass-border)] px-6 md:px-12 lg:px-20 py-3.5 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className="text-emerald-600" size={22} />
                        <span className="text-lg font-black italic tracking-tighter uppercase text-[var(--foreground)]">
                            Cyber<span className="text-emerald-600">Sentinel</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end">
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Last Sync</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-60">{lastScan || 'PENDING...'}</span>
                    </div>
                    <button
                        onClick={triggerScan}
                        className="p-2 rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-emerald-500 hover:border-emerald-500/50 transition-all hover:bg-emerald-500/10 group relative"
                    >
                        {pendingThreats.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-[var(--card-bg)] animate-bounce">
                                {pendingThreats.length} PENDING
                            </span>
                        )}
                        <RefreshCw size={16} className={`${isScanning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>
            </header>

            {/* Hero */}
            <HeroSection threats={threats} activeTab={activeTab} onTabChange={setActiveTab} />

            <AnimatePresence>
                {activeTab === 'threat' && (
                    <motion.main
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-[1700px] mx-auto px-6 md:px-12 lg:px-20 py-8"
                    >

                {/* Filters + Feed */}
                <div className="mt-10">
                    {/* Filter bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
                        {/* Category filters */}
                        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                            <Filter size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                            <div className="flex gap-2 flex-wrap">
                                {categoryOptions.map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setCategoryFilter(opt.key)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition-all border ${categoryFilter === opt.key
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--glass-border)] hover:border-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/5'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1 hidden md:block" />

                        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 items-start sm:items-center">
                            {/* Date filter */}
                            <div className="flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg p-1 w-full sm:w-auto shadow-sm">
                                {dateOptions.map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setDateFilter(opt.key)}
                                        className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all ${dateFilter === opt.key
                                            ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
                                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="relative w-full sm:w-52">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search threats..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--text-dim)] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 w-full transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Feed header */}
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-2xl font-black italic tracking-tight uppercase text-[var(--foreground)]">
                                Latest <span className="text-emerald-500">Threat</span> Feed
                            </h2>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--card-bg)] px-3 py-1.5 border border-[var(--glass-border)] rounded-lg tracking-widest shadow-sm">
                            {feedThreats.length} Vectors
                        </div>
                    </div>

                    {/* Feed grid */}
                    {feedThreats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Search size={40} className="mb-4 opacity-30" />
                            <p className="text-sm font-mono">No threats match your current filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            <AnimatePresence>
                                {feedThreats.map((threat, idx) => (
                                    <motion.div
                                        key={threat.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                                    >
                                        <ThreatCard threat={threat} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.main>
        )}
    </AnimatePresence>

        </div>
    );
}
