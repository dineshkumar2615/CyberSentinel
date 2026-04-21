'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bookmark, Check, Eye, ThumbsUp, AlertTriangle, Bug, Lock, Globe, Zap, Shield, Cpu } from 'lucide-react';
import { Threat } from '@/lib/types';
import ThreatDetailModal from './ThreatDetailModal';
import { humanizeHeadline } from '@/lib/utils/humanizer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ThreatCardProps {
    threat: Threat;
}

export default function ThreatCard({ threat }: ThreatCardProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [votes, setVotes] = useState(threat.usefulVotes || 0);
    const [hasVoted, setHasVoted] = useState(false);
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        const checkSavedStatus = async () => {
            try {
                const res = await fetch('/api/users/saved-threats');
                if (res.ok) {
                    const savedThreats = await res.json();
                    setIsSaved(savedThreats.some((t: Threat) => t.id === threat.id));
                }
            } catch { }
        };
        checkSavedStatus();
    }, [threat.id]);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        try {
            const method = isSaved ? 'DELETE' : 'POST';
            const url = isSaved ? `/api/users/saved-threats?threatId=${threat.id}` : '/api/users/saved-threats';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method === 'POST' ? JSON.stringify({ threatId: threat.id }) : undefined
            });
            if (res.ok) setIsSaved(!isSaved);
        } catch { } finally {
            setIsSaving(false);
        }
    };

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status !== 'authenticated') {
            router.push('/login');
            return;
        }
        if (hasVoted) return;
        setVotes(prev => prev + 1);
        setHasVoted(true);
        try { await fetch(`/api/threats/${threat.id}`, { method: 'PATCH' }); } catch { }
    };

    const severityConfig = {
        critical: { 
            line: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]', 
            badge: 'bg-red-500/10 text-red-400 border-red-500/30', 
            glow: 'hover:shadow-[0_0_50px_-10px_rgba(239,68,68,0.25)] hover:border-red-500/40',
            label: 'CRITICAL', 
            icon: <AlertTriangle size={11} /> 
        },
        high: { 
            line: 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.9)]', 
            badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', 
            glow: 'hover:shadow-[0_0_50px_-10px_rgba(249,115,22,0.25)] hover:border-orange-500/40',
            label: 'HIGH', 
            icon: <Zap size={11} /> 
        },
        medium: { 
            line: 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]', 
            badge: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30', 
            glow: 'hover:shadow-[0_0_50px_-10px_rgba(250,204,21,0.25)] hover:border-yellow-400/40',
            label: 'MEDIUM', 
            icon: <Shield size={11} /> 
        },
        low: { 
            line: 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]', 
            badge: 'bg-green-400/10 text-green-500 border-green-400/30', 
            glow: 'hover:shadow-[0_0_40px_-10px_rgba(74,222,128,0.2)] hover:border-green-400/30',
            label: 'LOW', 
            icon: <Globe size={11} /> 
        },
    };

    const getThreatIcon = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('malware') || t.includes('ransomware') || t.includes('virus')) return <Bug size={18} className="text-red-400" />;
        if (t.includes('breach') || t.includes('leak') || t.includes('stole')) return <Lock size={18} className="text-orange-400" />;
        if (t.includes('vulnerability') || t.includes('exploit') || t.includes('flaw')) return <Cpu size={18} className="text-yellow-500" />;
        return <Globe size={18} className="text-emerald-500" />;
    };

    const config = severityConfig[threat.severity as keyof typeof severityConfig] || severityConfig.low;
    const simplifiedTitle = humanizeHeadline(threat.title);

    return (
        <>
            <motion.div
                whileHover={{ y: -6 }}
                className={`group relative flex flex-col h-full bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl overflow-hidden transition-all duration-500 ${config.glow} backdrop-blur-sm`}
            >
                {/* Cyberpunk Grid Background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity mix-blend-overlay">
                    <div className="absolute inset-0 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:20px_20px] text-[var(--foreground)]" />
                </div>

                {/* Animated Left Severity Indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.line} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--glass-border)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity rounded-tr-2xl`} />

                <div className="p-4 sm:p-5 flex flex-col h-full relative z-10 pl-5 sm:pl-6">
                    {/* Top Section */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors ${config.badge}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-70" />
                                {config.label}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--foreground)]/50 font-mono font-medium tracking-wide">
                                <span className="uppercase truncate max-w-[120px] bg-[var(--glass-bg)] px-1.5 rounded border border-[var(--glass-border)]">
                                    {threat.source}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 min-w-max text-[10px] text-[var(--foreground)]/40 font-mono border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-0.5 rounded-full pl-1.5">
                            <Clock size={10} className="text-[var(--foreground)]/30" />
                            {new Date(threat.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    </div>

                    {/* Middle Section: Title & Description */}
                    <div className="flex items-start gap-3.5 mb-2 mt-1">
                        <div 
                            onClick={() => setIsModalOpen(true)}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg shadow-sm group-hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer"
                        >
                            {getThreatIcon(threat.title)}
                        </div>
                        <div className="min-w-0">
                            <h3 
                                onClick={() => setIsModalOpen(true)}
                                className="text-sm font-bold text-[var(--foreground)] leading-snug mb-1.5 hover:text-emerald-500 transition-colors line-clamp-2 cursor-pointer"
                            >
                                {simplifiedTitle}
                            </h3>
                            {simplifiedTitle !== threat.title && (
                                <p className="text-[9px] text-[var(--foreground)]/30 font-mono line-clamp-1 truncate block hover:text-[var(--foreground)]/60 transition-colors" title={threat.title}>Orig: {threat.title}</p>
                            )}
                        </div>
                    </div>

                    <p className="text-[13px] text-[var(--foreground)]/60 leading-relaxed mb-6 line-clamp-3 flex-1 px-1">
                        {threat.description}
                    </p>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 sm:pt-4 border-t border-[var(--glass-border)] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (status !== 'authenticated') {
                                        router.push('/login');
                                        return;
                                    }
                                    setIsModalOpen(true);
                                }}
                                className="h-8 px-3.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-[10px] font-black uppercase text-[var(--foreground)]/70 hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all flex items-center gap-1.5 shadow-sm group/btn"
                            >
                                <Eye size={12} className="text-emerald-500/60 group-hover/btn:text-emerald-500 transition-colors" />
                                Inspect
                            </button>
                            <button
                                onClick={handleVote}
                                className={`h-8 px-3 border rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 shadow-sm ${hasVoted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--foreground)]/50 hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)]/80 group/vote'
                                    }`}
                            >
                                <ThumbsUp size={12} className={hasVoted ? 'text-emerald-500' : 'text-[var(--foreground)]/40 group-hover/vote:text-[var(--foreground)]/60'} />
                                {votes}
                            </button>
                        </div>
                        <button
                            onClick={handleSave}
                            className={`h-8 px-3 border rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5 shadow-sm ${isSaved
                                    ? 'bg-emerald-500 text-white border-emerald-400'
                                    : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--foreground)]/60 hover:border-[var(--foreground)]/20 hover:bg-[var(--glass-bg)] hover:text-[var(--foreground)] group/save'
                                }`}
                        >
                            {isSaved ? <Check size={12} strokeWidth={3} /> : <Bookmark size={12} className="text-[var(--foreground)]/40 group-hover/save:text-[var(--foreground)]" />}
                            {isSaved ? 'Archived' : 'Archive'}
                        </button>
                    </div>
                </div>
            </motion.div>

            <ThreatDetailModal
                threat={threat}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
