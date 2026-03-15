"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, User, Shield, CreditCard, ArrowRight, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: username, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Something went wrong");
            } else {
                router.push("/login?signup=success");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-[var(--background)] relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />

                {/* Hex Grid Subtle Background */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59,130,246,0.3) 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md px-6 z-10"
            >
                <div className="relative group">
                    {/* Card Glow - Theme Aware */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl blur opacity-10 dark:opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

                    <div className="relative bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                <User className="w-8 h-8 text-purple-400" />
                            </div>
                            <h1 className="text-2xl font-bold font-mono tracking-tighter text-[var(--foreground)] uppercase italic">Sign Up</h1>
                            <p className="text-[var(--text-muted)] text-sm mt-1 font-mono">Create your free account</p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-mono text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-purple-400 uppercase tracking-widest ml-1">Your Name</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-[var(--text-dim)] group-focus-within/input:text-purple-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoComplete="username"
                                        className="block w-full pl-10 pr-3 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
                                        placeholder="Username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-purple-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-[var(--text-dim)] group-focus-within/input:text-purple-400 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        className="block w-full pl-10 pr-3 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-purple-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-[var(--text-dim)] group-focus-within/input:text-purple-400 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="block w-full pl-10 pr-3 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                                <div className="flex gap-1 mt-1 px-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-1 flex-1 bg-[var(--glass-border)] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: password.length > i * 2 ? '100%' : '0%' }}
                                                className="h-full bg-purple-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-start space-x-2 pt-2">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-purple-600 focus:ring-purple-500/50"
                                    required
                                />
                                <label htmlFor="terms" className="text-[10px] text-[var(--text-muted)] font-mono leading-tight">
                                    I accept the <span className="text-purple-400">Terms of Service</span> and <span className="text-purple-400">Privacy Policy</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-mono font-bold text-sm tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all flex items-center justify-center group relative overflow-hidden mt-4"
                            >
                                <span className="relative z-10 flex items-center">
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    ) : (
                                        <>Create Account <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-[var(--text-dim)] font-mono">
                    Already have an account?{' '}
                    <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold underline-offset-4 hover:underline transition-all">
                        Log In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
