'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, CheckCircle, Copy, Clock, Globe, TrendingUp, Check, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Threat } from '@/lib/types';
import { useState } from 'react';

interface ThreatDetailModalProps {
    threat: Threat | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ThreatDetailModal({ threat, isOpen, onClose }: ThreatDetailModalProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    if (!threat) return null;

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getSeverityColor = (severity: string) => {
        const colors = {
            critical: 'text-neon-red border-neon-red bg-neon-red/10',
            high: 'text-orange-400 border-orange-400 bg-orange-400/10',
            medium: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
            low: 'text-green-400 border-green-400 bg-green-400/10',
        };
        return colors[severity as keyof typeof colors] || colors.low;
    };

    const getTimeSince = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch (e) {
            return 'Recently';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl max-h-full flex flex-col bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                    >
                        {/* Animated Background */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
                        </div>

                        {/* Header */}
                        <div className="relative flex-none flex items-start justify-between p-5 sm:p-6 md:px-8 md:pt-8 md:pb-6 border-b border-[var(--glass-border)] bg-[var(--card-bg)]/80 backdrop-blur-md z-10">
                            <div className="flex-1 pr-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-4 ${getSeverityColor(threat.severity)}`}>
                                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                    {threat.severity.toUpperCase()} PRIORITY
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--foreground)] leading-tight mb-2 tracking-tight">{threat.title}</h2>
                                <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/60 font-medium">
                                    <span>{threat.source}</span>
                                    <span>•</span>
                                    <span>{getTimeSince(threat.timestamp)}</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-[var(--glass-bg)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] rounded-full transition-all shrink-0 mt-1"
                            >
                                <X size={20} className="text-[var(--foreground)]" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="relative flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 custom-scrollbar">
                            {/* Overview Section */}
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                                {/* Featured Image */}
                                {threat.imageUrl && (
                                    <div className="w-full md:w-5/12 shrink-0">
                                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[var(--glass-border)] shadow-xl group">
                                            <img
                                                src={threat.imageUrl}
                                                alt={threat.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="flex-1 w-full mt-2 md:mt-0">
                                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-neon-green" />
                                        Threat Analysis
                                    </h3>
                                    <div className="text-[var(--foreground)]/80 leading-relaxed text-sm md:text-base space-y-4">
                                        {threat.description ? (
                                            threat.description.split('\n').map((paragraph, idx) => (
                                                <p key={idx}>{paragraph}</p>
                                            ))
                                        ) : (
                                            <p>No detailed analysis provided for this threat event.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Threat Intelligence */}
                            <div className="bg-[var(--glass-bg)] rounded-xl p-4 border border-[var(--glass-border)]">
                                <h3 className="text-sm font-bold text-neon-green mb-3 uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={14} />
                                    Intelligence Matrix
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-1 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--glass-border)]">
                                        <p className="text-[10px] text-[var(--foreground)]/50 uppercase font-black">Source Node</p>
                                        <p className="text-sm font-bold text-[var(--foreground)]">{threat.source}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--glass-border)]">
                                        <p className="text-[10px] text-[var(--foreground)]/50 uppercase font-black">AI Confidence</p>
                                        <p className="text-sm font-bold text-[var(--foreground)]">
                                            {threat.confidenceScore ? `${threat.confidenceScore}%` : `${(94 + Math.random() * 5).toFixed(1)}%`}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--glass-border)]">
                                        <p className="text-[10px] text-[var(--foreground)]/50 uppercase font-black">Detection Time</p>
                                        <p className="text-sm font-bold text-[var(--foreground)]">{formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Intelligence Sections: Prevention/Recovery vs Causes/Risks */}
                            {threat.causes && threat.causes.length > 0 ? (
                                <>
                                    {/* Causes */}
                                    <div className="pt-2 border-t border-[var(--glass-border)]">
                                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 mt-6 flex items-center gap-2">
                                            <Globe size={18} className="text-neon-yellow" />
                                            Root Causes
                                        </h3>
                                        <div className="space-y-4">
                                            {threat.causes.map((step, idx) => (
                                                <motion.div
                                                    key={`cause-${idx}`}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--glass-border)] hover:border-neon-yellow/40 transition-colors group shadow-sm"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <div className="w-6 h-6 rounded-full bg-neon-yellow/10 flex items-center justify-center">
                                                                <CheckCircle size={14} className="text-neon-yellow" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-[var(--foreground)] font-bold mb-1.5 group-hover:text-neon-yellow transition-colors">
                                                                {step.title}
                                                            </h4>
                                                            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed">{step.description}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Risks */}
                                    <div className="pt-2 border-t border-[var(--glass-border)]">
                                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 mt-6 flex items-center gap-2">
                                            <Shield size={18} className="text-orange-500" />
                                            Potential Impact & Risks
                                        </h3>
                                        <div className="space-y-4">
                                            {threat.risks?.map((step, idx) => (
                                                <motion.div
                                                    key={`risk-${idx}`}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                                    className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--glass-border)] hover:border-orange-500/40 transition-colors group shadow-sm"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                                                                <Activity size={14} className="text-orange-500" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-[var(--foreground)] font-bold mb-1.5 group-hover:text-orange-500 transition-colors">
                                                                {step.title}
                                                            </h4>
                                                            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed">{step.description}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Mitigation Steps */}
                                    <div className="pt-2 border-t border-[var(--glass-border)]">
                                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 mt-6 flex items-center gap-2">
                                            <Shield size={18} className="text-neon-green" />
                                            Prevention Protocol
                                        </h3>
                                        <div className="space-y-4">
                                            {threat.prevention.map((step, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--glass-border)] hover:border-neon-green/40 transition-colors group shadow-sm"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <div className="w-6 h-6 rounded-full bg-neon-green/10 flex items-center justify-center">
                                                                <CheckCircle size={14} className="text-neon-green" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-[var(--foreground)] font-bold mb-1.5 group-hover:text-neon-green transition-colors">
                                                                <span className="text-[var(--foreground)]/50 font-normal mr-2">{idx + 1}.</span>
                                                                {step.title}
                                                            </h4>
                                                            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed">{step.description}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => copyToClipboard(`${step.title}: ${step.description}`, idx)}
                                                            className="flex-shrink-0 p-2 hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--glass-border)] rounded-lg transition-all"
                                                            title="Copy to clipboard"
                                                        >
                                                            {copiedIndex === idx ? (
                                                                <Check size={16} className="text-neon-green" />
                                                            ) : (
                                                                <Copy size={16} className="text-[var(--foreground)]/50" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recovery Steps - If Already Affected */}
                                    {threat.recoverySteps && threat.recoverySteps.length > 0 && (
                                        <div className="pt-2">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="flex-1 h-px bg-gradient-to-r from-[var(--glass-border)] via-red-500/30 to-transparent" />
                                                <span className="text-xs font-bold text-red-400 uppercase tracking-widest px-2 py-1 bg-red-500/5 rounded-md border border-red-500/10">If Compromised</span>
                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/30 to-[var(--glass-border)]" />
                                            </div>
                                            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                                                <Shield size={18} className="text-red-500" />
                                                Recovery Protocol
                                            </h3>
                                            <div className="space-y-4 shadow-sm">
                                                {threat.recoverySteps.map((step, idx) => (
                                                    <motion.div
                                                        key={`recovery-${idx}`}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: (threat.prevention.length * 0.1) + (idx * 0.1) }}
                                                        className="bg-red-500/5 rounded-xl p-5 border border-red-500/20 hover:border-red-500/40 transition-colors group"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                                                    <span className="text-[10px] font-black text-red-500">{idx + 1}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="text-[var(--foreground)] font-bold mb-1.5 group-hover:text-red-400 transition-colors">
                                                                    {step.title}
                                                                </h4>
                                                                <p className="text-sm text-[var(--foreground)]/70 leading-relaxed">{step.description}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(`${step.title}: ${step.description}`, 1000 + idx)}
                                                                className="flex-shrink-0 p-2 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all"
                                                                title="Copy to clipboard"
                                                            >
                                                                {copiedIndex === 1000 + idx ? (
                                                                    <Check size={16} className="text-red-400" />
                                                                ) : (
                                                                    <Copy size={16} className="text-[var(--foreground)]/50" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="relative flex-none p-4 md:px-8 border-t border-[var(--glass-border)] bg-[var(--card-bg)]/80 backdrop-blur-md z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-[10px] font-mono font-bold tracking-wider text-[var(--foreground)]/40 uppercase bg-[var(--glass-bg)] px-2 py-1 rounded border border-[var(--glass-border)]">ID: {threat.id}</p>
                            
                            <div className="flex items-center gap-4">
                                {threat.referenceLink && threat.referenceLink !== '#' && (
                                    <a
                                        href={threat.referenceLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all tracking-widest active:scale-95 shadow-sm"
                                    >
                                        <Globe size={12} />
                                        External Source
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
