'use client';
import CyberLab from "@/components/CyberLab";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ScanPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Redirect logic removed - using action-based auth instead
    }, [status, router]);

    if (status === "loading") return <div className="min-h-screen bg-[var(--background)]" />;

    return (
        <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
            <main className="flex-1 min-h-screen bg-[var(--background)] p-2 md:p-4 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-2 md:mb-4">
                        <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] mb-2 italic tracking-tighter uppercase">
                            NEURAL <span className="text-neon-green">SCANNER</span>
                        </h1>
                        <p className="text-gray-400 text-sm max-w-md font-mono uppercase tracking-tight">
                            Malware Analysis Suite — Isolated neural environment for deep packet inspection.
                        </p>
                    </div>

                    <div className="w-full relative z-10">
                        <CyberLab />
                    </div>
                </div>
            </main>
        </div>
    );
}
