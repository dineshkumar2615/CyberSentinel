'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, AlertTriangle, CheckCircle, Globe, Terminal, Activity, Zap, Lock, Unlock, History, Trash2, ExternalLink, Cpu, Hash } from 'lucide-react';

interface ScanResult {
    _id?: string;
    id: string;
    url: string;
    riskScore: number;
    status: 'safe' | 'suspicious' | 'danger';
    flags: string[];
    tld: string;
    hosting: string;
    ssl: boolean;
    timestamp: string;
    visualAnalysis?: {
        uuid: string;
        screenshot: string;
        message: string;
    };
}

const ScreenshotItem = ({ src, uuid }: { src: string, uuid: string }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [isPending, setIsPending] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [isRealImageReady, setIsRealImageReady] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!isPending) return;

        const timer = setTimeout(() => {
            setImgSrc(`${src}?t=${Date.now()}`);
            setRetryCount(prev => prev + 1);
        }, 5000);

        if (retryCount > 10) {
            setIsPending(false);
        }

        return () => clearTimeout(timer);
    }, [src, retryCount, isPending]);

    if (hasError || (retryCount > 8 && !isRealImageReady)) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--glass-bg)] text-[var(--text-dim)] font-mono">
                <Shield size={32} className="mb-2 opacity-20" />
                <span className="text-[10px] uppercase tracking-tighter italic">Preview_Unavailable</span>
                <span className="text-[8px] opacity-40 mt-1">NO_RENDER_DETECTED</span>
            </div>
        );
    }

    return (
        <div className="relative group/shot w-full h-full overflow-hidden">
            {!isRealImageReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--glass-bg)] animate-pulse">
                    <Activity size={24} className="text-neon-blue opacity-50" />
                </div>
            )}
            <img
                src={imgSrc}
                alt="Cyber Analysis Preview"
                className={`w-full h-full object-cover object-top transition-all duration-700 ${isRealImageReady ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                onLoad={() => setIsRealImageReady(true)}
                onError={() => {
                    if (retryCount > 3) setHasError(true);
                }}
            />

            {isPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]/40 backdrop-blur-sm">
                    <Activity className="animate-spin text-neon-blue mb-2" size={24} />
                    <span className="text-[8px] font-mono text-neon-blue animate-pulse uppercase tracking-[0.2em]">Capturing_Visual_Data...</span>
                </div>
            )}
        </div>
    );
};

export default function CyberLab() {
    const { status } = useSession();
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const [history, setHistory] = useState<ScanResult[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const terminalContainerRef = useRef<HTMLDivElement>(null);

    const fetchHistory = async () => {
        if (status !== 'authenticated') return;
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/scrutinize/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error('Fetch history failed:', e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const res = await fetch('/api/scrutinize/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setHistory(prev => prev.filter(item => item._id !== id));
            }
        } catch (e) {
            console.error('Delete history item failed:', e);
        }
    };

    const clearHistory = async () => {
        if (!confirm('Clear all scan history?')) return;
        try {
            const res = await fetch('/api/scrutinize/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clearAll: true })
            });
            if (res.ok) {
                setHistory([]);
            }
        } catch (e) {
            console.error('Clear history failed:', e);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchHistory();
        }
    }, [status]);

    const addTerminalLine = (line: string) => {
        setTerminalLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`].slice(-10));
    };

    const runAnalysis = async () => {
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        if (!url || isScanning) return;

        setIsScanning(true);
        setResult(null);
        setScanProgress(0);
        setTerminalLines([]);

        const steps = [
            'INITIATING NEURAL HEURISTICS...',
            'CONNECTING TO VIRUSTOTAL_v3...',
            'RESOLVING DNS OVER TLS...',
            'EXTRACTING TLD ENTROPY...',
            'QUERYING MALWARE_DB_V4...',
            'ANALYIZING SSL CERTIFICATE CHAIN...',
            'CHECKING GOOGLE_SAFE_BROWSING...',
            'GENERATING RISK VECTOR...'
        ];

        // Animated progress
        const progressTimer = setInterval(() => {
            setScanProgress(prev => Math.min(prev + 2, 95));
        }, 150);

        try {
            // Log steps for visual effect
            for (let i = 0; i < steps.length; i++) {
                addTerminalLine(steps[i]);
                await new Promise(r => setTimeout(r, 400));
            }

            const response = await fetch('/api/scrutinize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error('Analysis Hub Unavailable');
            }

            const realResult = await response.json();

            clearInterval(progressTimer);
            setScanProgress(100);
            setResult(realResult);
            // Add to local history state
            setHistory(prev => [realResult, ...prev].slice(0, 50));
            addTerminalLine('SCRUTINY COMPLETE. THREAT VECTOR MAPPED.');

        } catch (error: any) {
            console.error('Analysis failed:', error);
            addTerminalLine(`ERROR: ${error.message}`);
            setScannerError('Please provide a valid link and try again.');
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        if (terminalContainerRef.current) {
            terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
        }
    }, [terminalLines]);

    return (
        <div className="w-full relative">
            {/* Error Popup */}
            <AnimatePresence>
                {scannerError && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <div className="bg-[var(--card-bg)] border-2 border-neon-red p-8 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(255,0,85,0.2)] text-center relative overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20" />

                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-neon-red/10 border border-neon-red rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle className="text-neon-red" size={32} />
                                </div>
                                <h3 className="text-xl font-black text-neon-red uppercase tracking-tighter mb-2">Analysis Failed</h3>
                                <p className="text-[var(--text-dim)] font-mono text-xs mb-8 leading-relaxed">
                                    {scannerError}
                                </p>
                                <button
                                    onClick={() => setScannerError(null)}
                                    className="w-full py-3 bg-neon-red text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-colors"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Bar - Aligned Header */}
            <div className="flex flex-row gap-2 md:gap-4 mb-8">
                <div className="flex-1 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                    <div className="relative flex bg-[var(--background)] border border-[var(--glass-border)] rounded-xl overflow-hidden backdrop-blur-3xl shadow-[0_0_30px_rgba(0,210,255,0.05)]">
                        <div className="hidden sm:flex items-center pl-4 pr-3 text-neon-blue border-r border-[var(--glass-border)] bg-[var(--glass-bg)]">
                            <Terminal size={18} className="animate-pulse" />
                        </div>
                        <input
                            type="text"
                            placeholder="TARGET URL..."
                            className="bg-transparent border-none outline-none text-[var(--foreground)] w-full font-mono text-xs sm:text-sm px-3 sm:px-4 py-3 sm:py-4 placeholder:text-[var(--text-dim)] tracking-wider"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
                        />
                    </div>
                </div>

                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-4 py-3 sm:py-4 rounded-xl transition-all border flex items-center justify-center gap-2 ${showHistory ? 'bg-neon-purple text-black border-neon-purple' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--foreground)] hover:border-neon-purple'}`}
                >
                    <History size={18} />
                    <span className="hidden sm:inline font-mono text-[10px] uppercase font-black">History</span>
                </button>

                <button
                    onClick={runAnalysis}
                    disabled={isScanning || !url}
                    className={`px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 border shadow-2xl relative overflow-hidden group/btn ${isScanning ? 'bg-[var(--card-bg)] border-[var(--glass-border)] text-[var(--foreground)]/50' :
                        !url ? 'bg-neon-blue/20 border-neon-blue/30 text-neon-blue/50 cursor-not-allowed' :
                            'bg-neon-blue text-black border-neon-blue shadow-neon-blue/40 hover:scale-[1.02] active:scale-95'
                        }`}
                >
                    {isScanning ? <Activity className="animate-spin" size={16} /> : <Zap size={16} className={url ? 'animate-pulse' : ''} />}
                    <span className="relative z-10 hidden sm:inline">{isScanning ? 'ANALYSING' : 'SCRUTINIZE'}</span>
                </button>
            </div>

            <div className={`grid grid-cols-1 ${showHistory ? 'lg:grid-cols-3' : ''} gap-4 transition-all duration-500 relative`}>
                {/* History Sidebar Panel - Appears first on mobile */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="lg:col-span-1 h-full order-1 lg:order-2"
                        >
                            <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl overflow-hidden h-full flex flex-col min-h-[500px]">
                                <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] flex justify-between items-center">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-purple flex items-center gap-2">
                                        <History size={14} /> Scan_Archive
                                    </h3>
                                    {history.length > 0 && (
                                        <button
                                            onClick={clearHistory}
                                            className="p-1.5 text-[var(--text-dim)] hover:text-red-500 transition-colors"
                                            title="Clear History"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                                    {history.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-dim)] text-center p-8">
                                            <Activity size={24} className="mb-4 opacity-10" />
                                            <p className="text-[8px] uppercase tracking-widest font-mono">No_Historical_Data</p>
                                        </div>
                                    ) : (
                                        history.map((item) => (
                                            <motion.div
                                                key={item._id || item.id}
                                                layout
                                                onClick={() => {
                                                    setResult(item);
                                                    setUrl(item.url);
                                                    if (window.innerWidth < 1024) setShowHistory(false);
                                                }}
                                                className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-3 rounded-xl cursor-pointer hover:border-neon-blue group/hitem transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${item.status === 'danger' ? 'bg-neon-red shadow-[0_0_8px_#ff0055]' :
                                                        item.status === 'suspicious' ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' :
                                                            'bg-neon-green shadow-[0_0_8px_#00ff9d]'
                                                        }`} />
                                                    <button
                                                        onClick={(e) => deleteHistoryItem(e, item._id!)}
                                                        className="opacity-0 group-hover/hitem:opacity-100 p-1 text-[var(--text-dim)] hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <div className="text-[10px] font-mono text-[var(--foreground)] truncate mb-1">
                                                    {item.url}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] text-[var(--text-dim)] font-mono">
                                                        {new Date(item.timestamp).toLocaleDateString()}
                                                    </span>
                                                    <span className={`text-[8px] font-black font-mono ${item.status === 'danger' ? 'text-neon-red' :
                                                        item.status === 'suspicious' ? 'text-yellow-500' :
                                                            'text-neon-green'
                                                        }`}>
                                                        {item.riskScore}% SAFE
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={`block ${showHistory ? 'lg:col-span-2' : 'col-span-1'} space-y-2 order-2 lg:order-1`}>
                    <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl relative overflow-hidden min-h-[500px] flex flex-col">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-neon-blue/5 to-transparent opacity-20" />
                        </div>

                        <div className="flex-1 flex items-center justify-center relative p-4">
                            <AnimatePresence mode="wait">
                                {!isScanning && !result && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center z-10"
                                    >
                                        <div className="relative w-32 h-32 mx-auto mb-6">
                                            <div className="absolute inset-0 border-2 border-[var(--glass-border)] rounded-full animate-[spin_10s_linear_infinite]" />
                                            <div className="absolute inset-2 border border-dashed border-[var(--glass-border)] rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Shield className="text-[var(--foreground)]/10" size={48} />
                                            </div>
                                        </div>
                                        <p className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-[0.4em]">Neural Core Standby</p>
                                    </motion.div>
                                )}

                                {isScanning && (
                                    <div className="relative w-full max-w-lg flex flex-col items-center z-10">
                                        <div className="relative mb-12">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                                className="w-56 h-56 border-2 border-neon-blue/20 rounded-full border-t-neon-blue"
                                            />
                                            <motion.div
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                                                className="absolute inset-4 border border-neon-purple/20 rounded-full border-b-neon-purple"
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <div className="text-5xl font-black text-[var(--foreground)] font-mono tracking-tighter">
                                                    {Math.round(scanProgress)}%
                                                </div>
                                                <div className="text-[8px] text-neon-blue font-mono tracking-[0.3em] mt-2 animate-pulse">PATH_TRACE</div>
                                            </div>

                                            <motion.div
                                                className="absolute left-[-20%] right-[-20%] h-[2px] bg-neon-blue/50 shadow-[0_0_15px_#00d2ff] z-20"
                                                animate={{ top: ['0%', '100%', '0%'] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        </div>

                                        <div className="w-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg p-4 font-mono text-[9px] text-neon-green/80 shadow-2xl overflow-hidden">
                                            <div className="flex justify-between border-b border-[var(--glass-border)] pb-2 mb-2">
                                                <span className="text-[var(--foreground)]/50 uppercase tracking-widest">System_Console Log</span>
                                                <span className="animate-pulse">● LIVE</span>
                                            </div>
                                            <div
                                                ref={terminalContainerRef}
                                                className="h-24 overflow-y-auto scrollbar-hide scroll-smooth"
                                            >
                                                {terminalLines.map((line, i) => (
                                                    <div key={i} className="mb-1 opacity-80">{line}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-full h-full flex flex-col items-center justify-center z-20"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl">
                                            <div className="flex flex-col gap-3">
                                                {result.visualAnalysis && (
                                                    <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl overflow-hidden group/thumb relative aspect-video">
                                                        <ScreenshotItem
                                                            src={result.visualAnalysis.screenshot}
                                                            uuid={result.visualAnalysis.uuid}
                                                        />
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--background)]/90 to-transparent p-3 flex justify-between items-end">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-mono text-neon-blue font-bold uppercase tracking-wider bg-[var(--background)]/80 px-1.5 py-0.5 rounded inline-block w-fit shadow-sm">Visual_Forensic_Capture</span>
                                                                <span className="text-[6px] font-mono text-[var(--text-dim)] mt-1">ID: {result.visualAnalysis.uuid.substring(0, 12)}...</span>
                                                            </div>
                                                            <a
                                                                href={`https://urlscan.io/result/${result.visualAnalysis.uuid}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 bg-neon-blue text-black rounded-lg hover:bg-white transition-colors"
                                                            >
                                                                <ExternalLink size={10} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-3 rounded-xl flex justify-between items-center px-6 text-center sm:text-left transition-colors">
                                                    <div className="flex-1">
                                                        <div className="text-[9px] text-neon-blue/80 font-bold uppercase mb-1">Security Cloud</div>
                                                        <div className="text-xs font-bold text-[var(--foreground)] uppercase tracking-tight">{result.hosting}</div>
                                                    </div>
                                                    {result.visualAnalysis && (
                                                        <div className="hidden sm:block pl-4 border-l border-[var(--glass-border)]">
                                                            <div className="text-[8px] text-[var(--text-dim)] font-mono uppercase mb-0.5">Forensic_UUID</div>
                                                            <div className="text-[10px] font-mono text-neon-purple/90">{result.visualAnalysis.uuid.substring(0, 8)}...</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-4 rounded-xl flex items-center gap-6">
                                                    <div className={`relative w-20 h-20 rounded-xl flex items-center justify-center border-2 transform rotate-3 transition-all ${result.status === 'danger' ? 'bg-neon-red/10 border-neon-red shadow-[0_0_15px_rgba(255,0,85,0.2)]' :
                                                        result.status === 'suspicious' ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_15px_rgba(255,255,0,0.1)]' :
                                                            'bg-neon-green/10 border-neon-green shadow-[0_0_15px_rgba(0,255,157,0.1)]'
                                                        }`}>
                                                        <div className="transform -rotate-3">
                                                            {result.status === 'danger' ? <AlertTriangle className="text-neon-red" size={40} /> :
                                                                result.status === 'suspicious' ? <AlertTriangle className="text-yellow-500" size={40} /> :
                                                                    <CheckCircle className="text-neon-green" size={40} />}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className={`text-lg font-black uppercase tracking-tighter mb-0.5 ${result.status === 'danger' ? 'text-neon-red' :
                                                            result.status === 'suspicious' ? 'text-yellow-500' :
                                                                'text-neon-green'
                                                            }`}>
                                                            {result.status === 'danger' ? 'CRITICAL DETECTED' :
                                                                result.status === 'suspicious' ? 'RISK MITIGATION' :
                                                                    'SECURE DOMAIN'}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono text-[9px] uppercase tracking-widest">
                                                            <span>Safety Score: {result.riskScore}/100</span>
                                                            <span className="text-neon-purple/80 truncate max-w-[120px]">ID: {result.id.substring(0, 8)}...</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-3 rounded-xl backdrop-blur-md">
                                                    <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase mb-1.5 flex items-center gap-2 font-mono">
                                                        <Cpu size={10} className="text-neon-blue" /> Processor Feedback
                                                    </div>
                                                    <div className="space-y-1">
                                                        {result.flags.map((flag, i) => (
                                                            <div key={i} className="flex items-center gap-3 text-[10px] font-mono text-[var(--foreground)] opacity-80">
                                                                <div className={`w-1 h-1 rounded-full ${result.status === 'danger' ? 'bg-neon-red' : 'bg-neon-blue'}`} />
                                                                {flag}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-3 rounded-xl transition-all">
                                                    <div className="text-[9px] text-[var(--text-dim)] font-bold uppercase mb-0.5 font-mono">TLD_VECTOR</div>
                                                    <div className="text-base font-black text-[var(--foreground)] flex justify-between items-center tracking-tight">
                                                        <span>.{result.tld.toUpperCase()}</span>
                                                        <div className={`text-[10px] font-mono flex items-center gap-2 ${result.ssl ? 'text-neon-green' : 'text-neon-red'}`}>
                                                            {result.ssl ? <Lock size={12} /> : <Unlock size={12} />}
                                                            {result.ssl ? 'ENCRYPTED' : 'EXPOSED'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
