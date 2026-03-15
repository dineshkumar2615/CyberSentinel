'use client';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';
import { Threat } from '@/lib/types';
import { useMemo } from 'react';

const tooltipStyle = {
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'var(--foreground)',
    boxShadow: 'var(--shadow-premium)',
};
const itemStyle = { color: 'var(--foreground)', fontWeight: 600 };
const labelStyle = { color: 'var(--text-muted)', fontWeight: 500 };

interface AnalyticsProps {
    threats: Threat[];
}

export default function ThreatAnalytics({ threats }: AnalyticsProps) {
    // 1. Calculate Weekly Attack Velocity
    const trendData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (6 - i));
            return { name: days[d.getDay()], count: 0, fullDate: d.toDateString() };
        });

        threats.forEach(t => {
            const tDate = new Date(t.timestamp).toDateString();
            const dayEntry = last7Days.find(d => d.fullDate === tDate);
            if (dayEntry) dayEntry.count++;
        });

        return last7Days;
    }, [threats]);

    // 2. Calculate Vector Distribution (Categories)
    const categoryData = useMemo(() => {
        const categories: Record<string, { count: number; color: string }> = {
            'Malware': { count: 0, color: '#059669' },
            'Phishing': { count: 0, color: '#f97316' },
            'Ransomware': { count: 0, color: '#ef4444' },
            'Breaches': { count: 0, color: '#a855f7' },
            'Other': { count: 0, color: '#3b82f6' },
        };

        threats.forEach(t => {
            const title = t.title.toLowerCase();
            const desc = t.description.toLowerCase();
            if (title.includes('malware') || desc.includes('malware') || title.includes('virus')) categories['Malware'].count++;
            else if (title.includes('phish')) categories['Phishing'].count++;
            else if (title.includes('ransom')) categories['Ransomware'].count++;
            else if (title.includes('breach') || title.includes('leak')) categories['Breaches'].count++;
            else categories['Other'].count++;
        });

        return Object.entries(categories)
            .filter(([_, data]) => data.count > 0)
            .map(([name, data]) => ({ name, value: data.count, color: data.color }));
    }, [threats]);

    // 3. Calculate Targeted Sectors (Industries)
    const industryData = useMemo(() => {
        const sectors: Record<string, { count: number; color: string }> = {
            'Finance': { count: 0, color: '#0ea5e9' },
            'Healthcare': { count: 0, color: '#ec4899' },
            'Government': { count: 0, color: '#f59e0b' },
            'Technology': { count: 0, color: '#6366f1' },
            'Infrastructure': { count: 0, color: '#14b8a6' },
        };

        threats.forEach(t => {
            const text = (t.title + ' ' + t.description + ' ' + t.source).toLowerCase();
            if (text.includes('bank') || text.includes('finance') || text.includes('crypto')) sectors['Finance'].count++;
            else if (text.includes('health') || text.includes('hospital') || text.includes('medical')) sectors['Healthcare'].count++;
            else if (text.includes('gov') || text.includes('state') || text.includes('federal')) sectors['Government'].count++;
            else if (text.includes('software') || text.includes('cloud') || text.includes('tech')) sectors['Technology'].count++;
            else sectors['Infrastructure'].count++;
        });

        const total = Object.values(sectors).reduce((acc, curr) => acc + curr.count, 0) || 1;
        
        return Object.entries(sectors)
            .filter(([_, data]) => data.count > 0)
            .map(([name, data]) => ({ 
                name, 
                value: Math.round((data.count / total) * 100), 
                color: data.color 
            }));
    }, [threats]);

    return (
        <div className="w-full">
            <div className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 mb-1 uppercase font-black tracking-[0.25em] text-[10px]">
                            <Activity size={13} /> Global_Threat_Intelligence
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] italic tracking-tight uppercase leading-none">
                            Threat <span className="text-emerald-500">Analytics</span> & Patterns
                        </h2>
                    </div>
                    <div className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest shadow-sm">
                        Dataset: {threats.length}_Points
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Weekly Line Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl p-4 sm:p-6 shadow-xl min-w-0"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <TrendingUp size={17} className="text-emerald-500" />
                            <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest italic opacity-80">Weekly Attack Velocity</h3>
                        </div>
                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                                    <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dx={-8} />
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
                                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3}
                                        dot={{ r: 4, fill: 'var(--card-bg)', stroke: '#10b981', strokeWidth: 2 }}
                                        activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Category Donut */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl p-4 sm:p-6 shadow-xl min-w-0"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <PieIcon size={17} className="text-emerald-500" />
                            <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest italic opacity-80">Vector Distribution</h3>
                        </div>
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                                        {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {categoryData.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Industry Targets Donut */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl p-4 sm:p-6 shadow-xl min-w-0"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <PieIcon size={17} className="text-emerald-500" />
                            <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest italic opacity-80">Targeted Sectors</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={industryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                                            {industryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {industryData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-[var(--background)]/30 rounded-xl border border-[var(--glass-border)] transition-colors hover:bg-[var(--foreground)]/5">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.2)]" style={{ backgroundColor: item.color }} />
                                        <div>
                                            <div className="text-[10px] font-black text-[var(--foreground)]/70 uppercase tracking-wider">{item.name}</div>
                                            <div className="text-lg font-black italic leading-none mt-1" style={{ color: item.color }}>{item.value}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
