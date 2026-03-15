"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, X } from 'lucide-react';

export default function MaintenanceBanner() {
    const [schedule, setSchedule] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isImminent, setIsImminent] = useState(false);

    useEffect(() => {
        const fetchMaintenance = async () => {
            try {
                const res = await fetch('/api/admin/maintenance');
                if (res.ok) {
                    const data = await res.json();
                    setSchedule(data);
                    
                    if (data.maintenanceStart) {
                        const start = new Date(data.maintenanceStart);
                        const now = new Date();
                        const diffInHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
                        
                        // Show if starting within 24 hours or already active
                        if (diffInHours <= 24 && diffInHours > -2) {
                            setIsImminent(true);
                        } else {
                            setIsImminent(false);
                        }
                    } else if (data.isMaintenanceMode) {
                        setIsImminent(true);
                    } else {
                        setIsImminent(false);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch maintenance for banner");
            }
        };

        fetchMaintenance();
        const interval = setInterval(fetchMaintenance, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    if (!isImminent || !isVisible || !schedule) return null;

    const start = schedule.maintenanceStart ? new Date(schedule.maintenanceStart) : null;
    const now = new Date();
    const isActive = schedule.isMaintenanceMode || (start && now >= start);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`w-full relative z-[100] border-b overflow-hidden shadow-2xl ${
                    isActive 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {isActive ? <AlertCircle size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-red-500' : 'text-yellow-600'}`}>
                                {isActive ? 'SYSTEM_MAINTENANCE_ACTIVE' : 'UPCOMING_MAINTENANCE_WINDOW'}
                            </span>
                            <span className="text-[11px] text-[var(--foreground)] opacity-80 font-mono">
                                {schedule.maintenanceMessage || "Priority security upgrades in progress."}
                                {start && !isActive && ` (Starts: ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${start.toLocaleDateString()})`}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-[var(--foreground)]/5 rounded-md transition-colors text-[var(--text-muted)]"
                    >
                        <X size={16} />
                    </button>
                </div>
                
                {/* Horizontal Progress bar effect */}
                <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className={`h-[1px] w-full transform origin-left ${isActive ? 'bg-red-500/50' : 'bg-yellow-500/50'}`}
                />
            </motion.div>
        </AnimatePresence>
    );
}
