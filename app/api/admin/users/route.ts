import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { auth } from '@/auth';

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Prevent admin from deleting themselves
        if (email === session.user?.email) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
        }

        await dbConnect();
        const deleted = await User.findOneAndDelete({ email });

        if (!deleted) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `User ${email} deleted` });
    } catch (error) {
        console.error('Delete User Error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
