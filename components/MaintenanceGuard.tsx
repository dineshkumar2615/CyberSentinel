"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Shield, AlertCircle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [message, setMessage] = useState("");
    const [schedule, setSchedule] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const res = await fetch('/api/admin/maintenance');
                if (res.ok) {
                    const data = await res.json();

                    const now = new Date();
                    const start = data.maintenanceStart ? new Date(data.maintenanceStart) : null;
                    const end = data.maintenanceEnd ? new Date(data.maintenanceEnd) : null;

                    // Maintenance is active if toggle is ON OR if we are within a scheduled window
                    let active = data.isMaintenanceMode;
                    if (!active && start && end) {
                        active = now >= start && now <= end;
                    }

                    setIsMaintenance(active);
                    setMessage(data.maintenanceMessage);
                    setSchedule({ start: data.maintenanceStart, end: data.maintenanceEnd });
                }
            } catch (err) {
                console.error("Failed to check maintenance status");
            } finally {
                setLoading(false);
            }
        };

        // Don't check for admin routes to prevent lockout
        if (!pathname?.startsWith('/admin') && pathname !== '/login') {
            checkMaintenance();
        } else {
            setLoading(false);
        }
    }, [pathname]);

    const isAdmin = (session?.user as any)?.role === 'admin';

    if (loading) return children;

    // Only block non-admins when maintenance is on
    if (isMaintenance && !isAdmin && !pathname?.startsWith('/admin') && pathname !== '/login') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,51,51,0.1),transparent_70%)]" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 max-w-lg"
                >
                    <div className="w-24 h-24 bg-neon-red/10 rounded-full flex items-center justify-center mb-8 border border-neon-red/30 mx-auto shadow-[0_0_50px_rgba(255,51,51,0.2)]">
                        <Shield className="w-12 h-12 text-neon-red animate-pulse" />
                    </div>

                    <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mb-4">
                        System Maintenance
                    </h1>

                    <p className="text-gray-400 font-mono text-sm leading-relaxed mb-4">
                        {message || "The CyberSentinel infrastructure is currently undergoing a priority security upgrade. Regular access is temporarily suspended."}
                    </p>

                    {schedule.end && (
                        <div className="mb-8 p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl inline-block">
                            <p className="text-[10px] font-black uppercase text-neon-red tracking-widest">Expected Restoration</p>
                            <p className="text-xl font-bold text-white font-mono">
                                {new Date(schedule.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                                {new Date(schedule.end).toLocaleDateString()}
                            </p>
                        </div>
                    )}

                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 text-left">
                        <Lock className="text-neon-red" size={24} />
                        <div>
                            <p className="text-[10px] font-black uppercase text-neon-red tracking-widest">Protocol Delta Active</p>
                            <p className="text-xs text-gray-500 font-mono">Operations will resume once the neural link is stabilized.</p>
                        </div>
                    </div>

                    <div className="mt-12 flex justify-center gap-2">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                className="w-2 h-2 bg-neon-red rounded-full"
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    return children;
}
