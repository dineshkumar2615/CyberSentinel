'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-3 rounded-full transition-all group relative overflow-hidden shadow-lg border z-50 ${theme === 'dark'
                ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white'
                : 'bg-white border-zinc-200 hover:bg-gray-100 text-zinc-900'
                }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.5, type: 'spring' }}
            >
                {theme === 'dark' ? (
                    <Sun size={20} className="text-yellow-400 group-hover:text-yellow-300 drop-shadow-[0_0_8px_rgba(255,255,0,0.5)]" />
                ) : (
                    <Moon size={20} className="text-neon-purple group-hover:text-neon-pink drop-shadow-[0_0_8px_rgba(188,19,254,0.5)]" />
                )}
            </motion.div>
        </button>
    );
}
