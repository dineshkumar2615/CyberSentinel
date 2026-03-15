"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Activity, Users, AlertTriangle,
    Settings, Eye, EyeOff, Star, Trash2,
    Power, RefreshCw, ChevronRight, BarChart3,
    Cpu, HardDrive, Globe, Bell, Search,
    Calendar, Clock, ShieldCheck, MessageSquare,
    Database, Zap, Lock
} from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Threat } from "@/lib/types";

export default function AdminDashboard() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() { redirect("/login"); }
    });

    const [threats, setThreats] = useState<Threat[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [maintenance, setMaintenance] = useState({
        isMaintenanceMode: false,
        maintenanceMessage: "",
        maintenanceStart: "",
        maintenanceEnd: ""
    });
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [userSearchQuery, setUserSearchQuery] = useState("");

    const isAdmin = (session?.user as any)?.role === 'admin';

    useEffect(() => {
        if (!isAdmin && status === 'authenticated') redirect("/dashboard");
    }, [isAdmin, status]);

    const fetchData = async () => {
        try {
            const [threatsRes, statsRes, maintRes] = await Promise.all([
                fetch('/api/threats'),
                fetch('/api/admin/stats'),
                fetch('/api/admin/maintenance')
            ]);

            if (threatsRes.ok) setThreats(await threatsRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
            if (maintRes.ok) {
                const data = await maintRes.json();
                setMaintenance({
                    ...data,
                    maintenanceStart: data.maintenanceStart ? new Date(data.maintenanceStart).toISOString().slice(0, 16) : "",
                    maintenanceEnd: data.maintenanceEnd ? new Date(data.maintenanceEnd).toISOString().slice(0, 16) : ""
                });
            }
        } catch (err) {
            console.error("Failed to fetch admin data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) fetchData();
        const interval = setInterval(() => {
            if (isAdmin) fetchData();
        }, 15000); // More frequent updates for "real-time" feel
        return () => clearInterval(interval);
    }, [isAdmin]);

    const toggleMaintenance = async () => {
        setIsUpdating(true);
        try {
            const res = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...maintenance,
                    isMaintenanceMode: !maintenance.isMaintenanceMode
                })
            });
            if (res.ok) {
                const data = await res.json();
                setMaintenance({
                    ...data,
                    maintenanceStart: data.maintenanceStart ? new Date(data.maintenanceStart).toISOString().slice(0, 16) : "",
                    maintenanceEnd: data.maintenanceEnd ? new Date(data.maintenanceEnd).toISOString().slice(0, 16) : ""
                });
            }
        } catch (err) {
            alert("Failed to toggle maintenance");
        } finally {
            setIsUpdating(false);
        }
    };

    const saveMaintenanceSchedule = async () => {
        setIsUpdating(true);
        try {
            const res = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(maintenance)
            });
            if (res.ok) alert("Schedule Updated");
        } catch (err) {
            alert("Failed to save schedule");
        } finally {
            setIsUpdating(false);
        }
    };

    const updateThreat = async (id: string, updates: Partial<Threat>) => {
        try {
            const res = await fetch('/api/admin/threats', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates })
            });
            if (res.ok) {
                const updated = await res.json();
                setThreats(prev => prev.map(t => t.id === id ? updated : t));
            }
        } catch (err) {
            alert("Failed to update threat");
        }
    };

    const deleteThreat = async (id: string) => {
        if (!confirm("Are you sure you want to delete this threat permanently?")) return;
        try {
            const res = await fetch(`/api/admin/threats?id=${id}`, { method: 'DELETE' });
            if (res.ok) setThreats(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            alert("Failed to delete threat");
        }
    };

    const filteredThreats = useMemo(() => {
        return threats.filter(t =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.source.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [threats, searchQuery]);

    const filteredUsers = useMemo(() => {
        return (stats?.users || []).filter((u: any) =>
            u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
        );
    }, [stats?.users, userSearchQuery]);

    if (loading || !isAdmin) return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-[var(--background)]">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen pt-12 pb-20 bg-[var(--background)] text-[var(--foreground)] px-4 md:px-8 font-mono">
            {/* Admin Header */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-500 mb-1">
                            <Shield size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Command Center Alpha</span>
                        </div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-[var(--foreground)]">
                            ADMIN_DASHBOARD
                        </h1>
                    </div>

                    {/* Maintenance Control */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] backdrop-blur-xl flex flex-col gap-3 shadow-lg">
                            <div className="flex items-center justify-between gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Service Status</span>
                                    <span className={`text-sm font-black uppercase italic ${maintenance.isMaintenanceMode ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {maintenance.isMaintenanceMode ? 'MAINTENANCE_ACTIVE' : 'SYSTEM_OPERATIONAL'}
                                    </span>
                                </div>
                                <button
                                    onClick={toggleMaintenance}
                                    disabled={isUpdating}
                                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${maintenance.isMaintenanceMode ? 'bg-red-500' : 'bg-[var(--glass-border)]'}`}
                                >
                                    <motion.div
                                        animate={{ x: maintenance.isMaintenanceMode ? 26 : 4 }}
                                        className="w-4 h-4 bg-[var(--foreground)] rounded-full absolute top-1 shadow-md"
                                    />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--glass-border)]">
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-[var(--text-muted)]" />
                                    <input
                                        type="datetime-local"
                                        value={maintenance.maintenanceStart}
                                        onChange={(e) => setMaintenance({ ...maintenance, maintenanceStart: e.target.value })}
                                        className="bg-transparent text-[10px] text-[var(--foreground)] outline-none border-b border-[var(--glass-border)] focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={12} className="text-[var(--text-muted)]" />
                                    <input
                                        type="datetime-local"
                                        value={maintenance.maintenanceEnd}
                                        onChange={(e) => setMaintenance({ ...maintenance, maintenanceEnd: e.target.value })}
                                        className="bg-transparent text-[10px] text-[var(--foreground)] outline-none border-b border-[var(--glass-border)] focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={saveMaintenanceSchedule}
                                    className="mt-2 text-[9px] font-black uppercase tracking-widest bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 py-1 rounded border border-[var(--glass-border)] transition-all text-[var(--foreground)]"
                                >
                                    Update Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                    { label: "Active Nodes", value: stats?.activeUsers || 0, icon: Users, color: "text-blue-500" },
                    { label: "Total Intelligence", value: stats?.totalThreats || 0, icon: Activity, color: "text-emerald-500" },
                    { label: "Priority Alerts", value: stats?.criticalThreats || 0, icon: AlertTriangle, color: "text-red-500" },
                    { label: "CPU Load", value: `${stats?.systemCpu || 0}%`, icon: Cpu, color: "text-yellow-500" },
                ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-sm">
                        <div>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black italic ${stat.color}`}>{stat.value}</p>
                        </div>
                        <stat.icon className={`${stat.color} opacity-20 group-hover:opacity-100 transition-opacity`} size={32} />
                    </div>
                ))}
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Management */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Module-Specific Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] relative overflow-hidden group shadow-sm">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                <ShieldCheck size={64} className="text-emerald-500" />
                            </div>
                            <h3 className="text-xs font-black uppercase text-emerald-500 mb-4 flex items-center gap-2">
                                <Zap size={14} /> Neural Lab Core
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Links Scrutinized</span>
                                    <span className="text-lg font-bold text-[var(--foreground)]">{stats?.neuralLab?.scansScrutinized || 0}</span>
                                </div>
                                <div className="flex justify-between items-end pb-2 border-b border-[var(--glass-border)]">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Reliability Percentage</span>
                                    <span className="text-lg font-bold text-emerald-500">{stats?.neuralLab?.reliabilityPercentage || 100}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] relative overflow-hidden group shadow-sm">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                <MessageSquare size={64} className="text-blue-500" />
                            </div>
                            <h3 className="text-xs font-black uppercase text-blue-500 mb-4 flex items-center gap-2">
                                <Lock size={14} /> Secure Messenger
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Keys Created</span>
                                    <span className="text-lg font-bold text-[var(--foreground)]">{stats?.secureMessenger?.keysCreated || 0}</span>
                                </div>
                                <div className="flex justify-between items-end pb-2 border-b border-[var(--glass-border)]">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Active Chats p/h</span>
                                    <span className="text-lg font-bold text-blue-500">{stats?.secureMessenger?.activeChats || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Threat Management Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-sm font-black uppercase italic tracking-widest text-[var(--text-muted)]">Post Management</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                                <input
                                    type="text"
                                    placeholder="SEARCH_THREATS..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg pl-9 pr-4 py-2 text-[10px] font-mono outline-none focus:border-emerald-500 transition-colors w-64 text-[var(--foreground)]"
                                />
                            </div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {filteredThreats.map((threat) => (
                                    <motion.div
                                        key={threat.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--glass-border)] flex items-center justify-between group hover:bg-[var(--foreground)]/5 transition-all shadow-sm"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--glass-border)] flex-shrink-0">
                                                <img src={threat.imageUrl} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h3 className="text-sm font-bold text-[var(--foreground)] truncate max-w-md">{threat.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${threat.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                                                        threat.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                                                            'bg-[var(--foreground)]/10 text-[var(--text-muted)]'
                                                        }`}>
                                                        {threat.severity}
                                                    </span>
                                                    <span className="text-[8px] text-[var(--text-muted)] uppercase font-mono">{threat.source}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => updateThreat(threat.id, { isHighlighted: !threat.isHighlighted })}
                                                className={`p-2 rounded-lg border transition-all ${threat.isHighlighted ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]/30'}`}
                                                title="Toggle Highlight"
                                            >
                                                <Star size={16} fill={threat.isHighlighted ? "currentColor" : "none"} />
                                            </button>
                                            <button
                                                onClick={() => updateThreat(threat.id, { isHidden: !threat.isHidden })}
                                                className={`p-2 rounded-lg border transition-all ${threat.isHidden ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]/30'}`}
                                                title="Toggle Visibility"
                                            >
                                                {threat.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={() => deleteThreat(threat.id)}
                                                className="p-2 rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] hover:border-red-500 hover:text-red-500 transition-all"
                                                title="Delete Permanently"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {filteredThreats.length === 0 && (
                                <div className="text-center py-20 bg-[var(--foreground)]/[0.02] border border-[var(--glass-border)] rounded-2xl">
                                    <p className="text-xs text-[var(--text-dim)] font-mono tracking-widest">NO_THREATS_MATCHING_TARGET_QUERY</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Users & Metrics */}
                <div className="space-y-8">

                    {/* Node Monitor (User List) */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-sm font-black uppercase italic tracking-widest text-[var(--text-muted)]">Node Monitor</h2>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={12} />
                                <input
                                    type="text"
                                    placeholder="SEARCH_NODES..."
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    className="bg-[var(--foreground)]/5 border border-[var(--glass-border)] rounded-lg pl-7 pr-2 py-1.5 text-[9px] font-mono outline-none focus:border-emerald-500 transition-colors w-40 text-[var(--foreground)]"
                                />
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredUsers.map((user: any, i: number) => (
                                <div key={i} className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--glass-border)] flex items-center justify-between group shadow-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                                            {user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-bold text-[var(--foreground)] truncate w-40">{user.email}</span>
                                            <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-tighter">Joined: {new Date(user.joined).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${user.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {user.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Real-time System Status */}
                    <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] space-y-6 shadow-sm">
                        <h2 className="text-[10px] font-black uppercase italic tracking-widest text-[var(--text-muted)]">System Telemetry</h2>

                        {/* Memory Usage */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <HardDrive size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Memory Matrix</span>
                                </div>
                                <span className="text-xs font-black text-emerald-500">{stats?.systemMemory || 0}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats?.systemMemory || 0}%` }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Network Throughput */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <Globe size={14} className="text-blue-500" />
                                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">G-Link Quality</span>
                                </div>
                                <span className="text-xs font-black text-blue-500">STABLE</span>
                            </div>
                            <div className="flex gap-1 items-end h-8">
                                {[...Array(15)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [`${20 + Math.random() * 40}%`, `${40 + Math.random() * 60}%`, `${20 + Math.random() * 40}%`] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                                        className="flex-1 bg-blue-500/30 rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* System Health */}
                        <div className="pt-4 border-t border-[var(--glass-border)] space-y-3 text-[9px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-muted)] uppercase tracking-widest">Encryption Core</span>
                                <span className="text-emerald-500 font-black">AES_256_ACTIVE</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-muted)] uppercase tracking-widest">Database Sync</span>
                                <span className="text-blue-500 font-black">SYNC_RT_LATENCY_0.02ms</span>
                            </div>
                        </div>
                    </div>

                    {/* Admin Message */}
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-3 mb-3 text-red-500">
                            <Bell size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Security Advisory</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-mono">
                            Protocol Gamma initialized. Monitoring all nodes for unauthorized decryption attempts. System stability prioritized.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
