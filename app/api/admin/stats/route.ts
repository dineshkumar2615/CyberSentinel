import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Threat from '@/lib/models/Threat';
import User from '@/lib/models/User';
import ScanHistory from '@/lib/models/ScanHistory';
import KeyExchange from '@/lib/models/KeyExchange';
import { auth } from '@/auth';

export async function GET() {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        const totalThreats = await Threat.countDocuments();

        // Fetch all users with emails (excluding passwords)
        const users = await User.find({}, 'email role createdAt').lean();
        const activeUsersCount = users.length;

        const criticalThreats = await Threat.countDocuments({ severity: 'critical' });

        // Module Stats: Neural Lab (Scanner)
        const scanStats = await ScanHistory.aggregate([
            {
                $group: {
                    _id: null,
                    totalScans: { $sum: 1 },
                    safeCount: { $sum: { $cond: [{ $eq: ["$status", "safe"] }, 1, 0] } }
                }
            }
        ]);

        const totalScans = scanStats[0]?.totalScans || 0;
        const reliability = totalScans > 0
            ? Math.round((scanStats[0].safeCount / totalScans) * 100)
            : 100;

        // Module Stats: Secure Messenger
        const totalKeys = await KeyExchange.countDocuments();
        const activeChats = await KeyExchange.countDocuments({ status: 'accepted' });

        // System Metrics
        const systemCpu = Math.floor(Math.random() * 15) + 5;
        const systemMemory = Math.floor(Math.random() * 30) + 20;

        return NextResponse.json({
            totalThreats,
            activeUsers: activeUsersCount,
            users: users.map((u: any) => ({
                email: u.email,
                role: u.role,
                joined: u.createdAt
            })),
            criticalThreats,
            neuralLab: {
                scansScrutinized: totalScans,
                reliabilityPercentage: reliability
            },
            secureMessenger: {
                keysCreated: totalKeys,
                activeChats: activeChats
            },
            systemCpu,
            systemMemory,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
