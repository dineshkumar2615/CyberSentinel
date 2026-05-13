'use client';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';
import { Threat } from '@/lib/types';
import { useState, useMemo } from 'react';

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
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');

    // 1. Calculate Attack Velocity
    const trendData = useMemo(() => {
        const now = new Date();
        
        if (timeframe === 'all') {
            // For 'all', we group by month for the last 12 months
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const data = Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(now.getMonth() - (11 - i));
                return { 
                    name: months[d.getMonth()], 
                    count: 0, 
                    monthKey: `${d.getFullYear()}-${d.getMonth()}` 
                };
            });

            threats.forEach(t => {
                const tDate = new Date(t.timestamp);
                const tKey = `${tDate.getFullYear()}-${tDate.getMonth()}`;
                const entry = data.find(d => d.monthKey === tKey);
                if (entry) entry.count++;
            });

            return data;
        }

        const length = timeframe === '7d' ? 7 : 30;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const data = Array.from({ length }, (_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (length - 1 - i));
            return { 
                name: timeframe === '7d' ? days[d.getDay()] : `${d.getMonth() + 1}/${d.getDate()}`, 
                count: 0, 
                fullDate: d.toDateString() 
            };
        });

        threats.forEach(t => {
            const tDate = new Date(t.timestamp).toDateString();
            const entry = data.find(d => d.fullDate === tDate);
            if (entry) entry.count++;
        });

        return data;
    }, [threats, timeframe]);

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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={17} className="text-emerald-500" />
                                <h3 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest italic opacity-80">{timeframe === '7d' ? 'Weekly' : 'Monthly'} Attack Velocity</h3>
                            </div>
                            <div className="flex bg-[var(--background)]/50 p-1 rounded-xl border border-[var(--glass-border)] w-fit">
                                <button
                                    onClick={() => setTimeframe('7d')}
                                    className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${timeframe === '7d' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                                >
                                    7 Days
                                </button>
                                <button
                                    onClick={() => setTimeframe('all')}
                                    className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${timeframe === 'all' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                                >
                                    All Time
                                </button>
                            </div>
                        </div>
                        <div className="h-[240px] -ml-4 sm:ml-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="var(--text-muted)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        stroke="var(--text-muted)" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        dx={-5} 
                                        tickCount={5}
                                    />
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ stroke: 'var(--glass-border)', strokeWidth: 1 }} />
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
