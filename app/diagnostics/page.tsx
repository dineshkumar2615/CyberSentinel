'use client';
import DeviceHealth from '@/components/DeviceHealth';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLayoutEffect } from 'react';

export default function DiagnosticsPage() {
    const { status } = useSession();
    const router = useRouter();

    useLayoutEffect(() => {
        // Redirect logic removed - using action-based auth instead
    }, [status, router]);

    if (status === 'loading') return <div className="min-h-screen bg-[var(--background)]" />;

    return (
        <main className="min-h-screen pt-6 pb-20 md:pb-6 bg-[var(--background)] px-4 md:px-8 relative overflow-hidden">
            <DeviceHealth hideHeader={false} />
        </main>
    );
}
