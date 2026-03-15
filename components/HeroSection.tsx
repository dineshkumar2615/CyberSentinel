"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, AlertTriangle, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { Threat } from '@/lib/types';
import Link from 'next/link';
import ThreatAnalytics from './ThreatAnalytics';

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

    const mainThreat = threats[0] || {
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

            <div className="max-w-[1700px] mx-auto px-6 md:px-12 lg:px-20 pt-6 pb-0 relative z-10">
                {/* Tab toggle */}
                <div className="flex items-center gap-1 mb-5 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg p-1 w-fit shadow-lg">
                    {([
                        { key: 'threat', label: 'Threat Overview', icon: AlertTriangle },
                        { key: 'analytics', label: 'Analytics', icon: TrendingUp },
                    ] as { key: Tab; label: string; icon: React.ElementType }[]).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
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

                <div className="relative min-h-[180px] md:min-h-[220px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'threat' ? (
                            /* ── Threat Overview ── */
                            <motion.div
                                key="threat"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="pb-10"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                        Major_Alert
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

                                    <div className="flex flex-col gap-4">
                                        <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 md:line-clamp-none">
                                            {mainThreat.description?.slice(0, 220)}{(mainThreat.description?.length ?? 0) > 220 ? '...' : ''}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Link
                                                href={(mainThreat as Threat).referenceLink || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-6 h-10 bg-red-500 text-white font-black italic rounded-lg transition-all hover:bg-red-600 hover:shadow-lg text-xs uppercase tracking-widest active:scale-95"
                                            >
                                                <Eye size={14} /> Analyze Threat
                                            </Link>
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
                                className="pb-8"
                            >
                                <div className="w-full overflow-x-hidden">
                                    <ThreatAnalytics threats={threats} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
