import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Threat from '@/lib/models/Threat';

// GET /api/users/saved-threats - Fetch all threats saved by the current user
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const savedThreatIds = user.savedThreats.map((st: any) => st.threatId);
        const threats = await Threat.find({ id: { $in: savedThreatIds } }).sort({ timestamp: -1 });

        return NextResponse.json(threats);
    } catch (error) {
        console.error('Error fetching saved threats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/users/saved-threats - Save a threat
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threatId } = await req.json();
        if (!threatId) {
            return NextResponse.json({ error: 'Threat ID is required' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Avoid duplicates
        const alreadySaved = user.savedThreats.some((st: any) => st.threatId === threatId);
        if (alreadySaved) {
            return NextResponse.json({ message: 'Threat already saved' });
        }

        user.savedThreats.push({ threatId, savedAt: new Date() });
        await user.save();

        return NextResponse.json({ message: 'Threat saved successfully', success: true });
    } catch (error) {
        console.error('Error saving threat:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/users/saved-threats?threatId=xyz - Unsave a threat
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const threatId = searchParams.get('threatId');
        if (!threatId) {
            return NextResponse.json({ error: 'Threat ID is required' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.savedThreats = user.savedThreats.filter((st: any) => st.threatId !== threatId);
        await user.save();

        return NextResponse.json({ message: 'Threat removed from saved', success: true });
    } catch (error) {
        console.error('Error removing saved threat:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
