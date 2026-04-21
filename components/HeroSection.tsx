"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, AlertTriangle, TrendingUp, PieChart as PieIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Threat } from '@/lib/types';
import Link from 'next/link';
import ThreatAnalytics from './ThreatAnalytics';
import ThreatDetailModal from './ThreatDetailModal';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface HeroProps {
    threats: Threat[];
    activeTab: 'threat' | 'analytics';
    onTabChange: (tab: 'threat' | 'analytics') => void;
}

const tooltipStyle = {
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'var(--foreground)',
    boxShadow: 'var(--shadow-premium)',
};

type Tab = 'threat' | 'analytics';

export default function HeroSection({ threats, activeTab, onTabChange }: HeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
    const { status } = useSession();
    const router = useRouter();

    // Get critical threats, or fallback to the first few threats if no critical ones exist
    const criticalThreats = threats.filter(t => t.severity === 'critical');
    const displayThreats = criticalThreats.length > 0 ? criticalThreats : threats.slice(0, 3);

    // Auto-rotate the carousel
    useEffect(() => {
        if (displayThreats.length <= 1 || activeTab !== 'threat' || isModalOpen) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % displayThreats.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [displayThreats.length, activeTab, isModalOpen]);

    const mainThreat = displayThreats[currentIndex] || {
        title: 'No Active Critical Threats',
        description: 'No major escalations detected in the last 7 days. Systems operating within normal parameters.',
        severity: 'low',
        source: 'System Monitor',
        referenceLink: '#',
    };

    return (
        <div className="w-full bg-[var(--background)] border-b border-[var(--glass-border)] relative overflow-hidden">
            {/* Red top accent */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(239,68,68,0.06)_0%,transparent_55%)] pointer-events-none" />

            <div className="max-w-[1700px] mx-auto px-6 md:px-12 lg:px-20 pt-4 pb-0 relative z-10">
                {/* Tab toggle */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg p-1 w-fit shadow-lg">
                        {([
                            { key: 'threat', label: 'Threat Overview', icon: AlertTriangle },
                            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
                        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    if (status !== 'authenticated') {
                                        router.push('/login');
                                        return;
                                    }
                                    onTabChange(tab.key);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === tab.key
                                    ? 'bg-[var(--foreground)] text-[var(--background)] shadow-lg'
                                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5'
                                    }`}
                            >
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Navigation Controls */}
                    {activeTab === 'threat' && displayThreats.length > 1 && (
                        <div className="hidden md:flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentIndex((prev) => (prev - 1 + displayThreats.length) % displayThreats.length)}
                                className="p-1.5 rounded-md bg-[var(--card-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-red-500/30 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="flex items-center gap-1.5 px-2">
                                {displayThreats.map((_, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'w-1.5 bg-[var(--glass-border)] hover:bg-[var(--text-muted)]'}`}
                                    />
                                ))}
                            </div>
                            <button 
                                onClick={() => setCurrentIndex((prev) => (prev + 1) % displayThreats.length)}
                                className="p-1.5 rounded-md bg-[var(--card-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-red-500/30 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative min-h-[240px] md:min-h-[280px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {activeTab === 'threat' ? (
                            /* ── Threat Overview ── */
                            <motion.div
                                key={`threat-${currentIndex}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="pb-6"
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                        {mainThreat.severity === 'critical' ? 'CRITICAL_ALERT' : 'MAJOR_ALERT'}
                                    </span>
                                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{mainThreat.source}</span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
                                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[var(--foreground)] leading-tight uppercase italic tracking-tighter">
                                        <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                            {mainThreat.title.split(' ').slice(0, 4).join(' ')}
                                        </span>
                                        {mainThreat.title.split(' ').length > 4 && (
                                            <> {mainThreat.title.split(' ').slice(4).join(' ')}</>
                                        )}
                                    </h1>

                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 md:line-clamp-none md:min-h-[4.5rem]">
                                            {mainThreat.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        if (status !== 'authenticated') {
                                                            router.push('/login');
                                                            return;
                                                        }
                                                        setSelectedThreat(mainThreat as Threat);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-6 h-10 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--foreground)] font-black italic rounded-lg transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-500 hover:shadow-lg text-xs uppercase tracking-widest active:scale-95"
                                                >
                                                    <Eye size={14} className="text-emerald-500" /> Inspect
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (status !== 'authenticated') {
                                                            router.push('/login');
                                                            return;
                                                        }
                                                        window.open((mainThreat as Threat).referenceLink || '#', '_blank', 'noopener,noreferrer');
                                                    }}
                                                    className="inline-flex items-center gap-2 px-6 h-10 bg-red-500 text-white font-black italic rounded-lg transition-all hover:bg-red-600 hover:shadow-lg text-xs uppercase tracking-widest active:scale-95"
                                                >
                                                    <ArrowRight size={14} /> Analyze Threat
                                                </button>
                                            </div>
                                            
                                            {/* Mobile indicator dots */}
                                            {displayThreats.length > 1 && (
                                                <div className="flex md:hidden items-center gap-1.5">
                                                    {displayThreats.map((_, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'w-1.5 bg-[var(--glass-border)]'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* ── Analytics View ── */
                            <motion.div
                                key="analytics"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="pb-4"
                            >
                                <div className="w-full overflow-x-hidden">
                                    <ThreatAnalytics threats={threats} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <ThreatDetailModal
                threat={(selectedThreat || mainThreat) as Threat}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTimeout(() => setSelectedThreat(null), 300); // delay clearing to allow animation
                }}
            />
        </div>
    );
}
