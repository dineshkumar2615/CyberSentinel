'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScannerOverlayProps {
    isScanning: boolean;
    onScanComplete: () => void;
}

export default function ScannerOverlay({ isScanning, onScanComplete }: ScannerOverlayProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isScanning) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 2; // finish in ~2.5s (50 steps * 50ms)
                });
            }, 50);

            const timeout = setTimeout(() => {
                onScanComplete();
            }, 3000); // slightly longer than progress to show "100%"

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, [isScanning, onScanComplete]);

    return (
        <AnimatePresence>
            {isScanning && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-[var(--background)]/95 flex flex-col items-center justify-center font-mono text-[var(--foreground)]"
                >
                    {/* Matrix Rain Effect (Simulated with simple CSS/Motion for performance) */}
                    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute text-neon-green text-xs whitespace-nowrap"
                                initial={{ top: -100, left: `${Math.random() * 100}%` }}
                                animate={{ top: '100%' }}
                                transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, ease: 'linear' }}
                            >
                                1001010100101001010101001010101010
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-64 h-64 relative flex items-center justify-center"
                    >
                        {/* Spinning Rings */}
                        <div className="absolute inset-0 border-4 border-neon-green/30 rounded-full animate-spin-slow" />
                        <div className="absolute inset-4 border-4 border-neon-green/50 rounded-full animate-reverse-spin border-t-transparent" />

                        <div className="text-4xl font-bold text-neon-green">
                            {progress}%
                        </div>
                    </motion.div>

                    <div className="mt-8 text-neon-green text-sm animate-pulse">
                        SCANNING GLOBAL NETWORKS...
                    </div>
                    <div className="text-[var(--foreground)]/60 text-xs mt-2">
                        Searching for signatures in sector 7G...
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
