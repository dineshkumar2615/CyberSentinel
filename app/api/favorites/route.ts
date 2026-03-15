import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

// GET /api/favorites - Fetch user's favorites
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email }).select('favorites');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ favorites: user.favorites || [] });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }
}

// POST /api/favorites - Add a new favorite
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { key, alias } = body;

        if (!key || !alias) {
            return NextResponse.json({ error: 'Key and alias are required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already exists
        const exists = user.favorites?.some((fav: any) => fav.key === key);
        if (exists) {
            return NextResponse.json({ message: 'Already in favorites' }, { status: 200 });
        }

        // Add to favorites
        user.favorites = user.favorites || [];
        user.favorites.push({
            key,
            alias,
            addedAt: new Date(),
        });

        await user.save();

        return NextResponse.json({
            message: 'Favorite added successfully',
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }
}

// DELETE /api/favorites - Remove a favorite
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Remove from favorites
        user.favorites = user.favorites?.filter((fav: any) => fav.key !== key) || [];

        await user.save();

        return NextResponse.json({
            message: 'Favorite removed successfully',
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }
}
