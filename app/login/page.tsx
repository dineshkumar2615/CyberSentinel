"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Shield, Fingerprint } from "lucide-react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else {
                // Fetch session to check role for redirection
                const session = await getSession();

                if ((session?.user as any)?.role === 'admin') {
                    router.push("/admin/dashboard");
                } else {
                    router.push("/dashboard");
                }
                router.refresh();
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-12 pb-12 flex flex-col items-center justify-center bg-[var(--background)] relative overflow-hidden transition-colors duration-300">
            {/* Animated Background Elements - Theme Aware */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/10 rounded-full blur-[120px]" />

                {/* Scanning Line Effect */}
                <motion.div
                    initial={{ top: "-10%" }}
                    animate={{ top: "110%" }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent z-1"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md px-6 z-10"
            >
                {/* Login Card */}
                <div className="relative group">
                    {/* Card Glow - Only in Dark Mode or Subtle in Light */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl blur opacity-10 dark:opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

                    <div className="relative bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 bg-neon-blue/10 rounded-full flex items-center justify-center mb-4 border border-neon-blue/30 shadow-[0_0_20px_rgba(var(--neon-blue),0.3)]">
                                <Shield className="w-8 h-8 text-neon-blue" />
                            </div>
                            <h1 className="text-2xl font-bold font-mono tracking-tighter text-[var(--foreground)] uppercase italic">Sign In</h1>
                            <p className="text-[var(--text-muted)] text-sm mt-1 font-mono">Welcome back! Please enter your details.</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
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
                                <label className="text-xs font-mono text-neon-blue uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-[var(--text-dim)] group-focus-within/input:text-neon-blue transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="off"
                                        className="block w-full pl-10 pr-3 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 transition-all font-mono text-sm"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-neon-blue uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-[var(--text-dim)] group-focus-within/input:text-neon-blue transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        className="block w-full pl-10 pr-3 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 transition-all font-mono text-sm"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-neon-blue focus:ring-neon-blue/50 focus:ring-offset-0"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-xs text-[var(--text-muted)] font-mono">
                                        Remember Me
                                    </label>
                                </div>
                                <div className="text-xs">
                                    <a href="#" className="font-mono text-neon-blue hover:text-neon-blue/80 transition-colors">
                                        Forgot Password?
                                    </a>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-neon-blue hover:bg-neon-blue/90 text-white rounded-xl font-mono font-bold text-sm tracking-widest shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/40 transition-all flex items-center justify-center group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center">
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    ) : (
                                        <>Sign In <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Consolidated Signup Link */}
                        <div className="mt-0 pt-0 border-t border-[var(--glass-border)] text-center">
                            <p className="text-[var(--text-muted)] text-xs font-mono">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-neon-blue hover:text-neon-blue/80 font-bold underline-offset-4 hover:underline transition-all">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
