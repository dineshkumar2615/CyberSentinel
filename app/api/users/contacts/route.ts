import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

// GET: Fetch user's contacts
export async function GET() {
    try {
        await dbConnect();

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get contact details
        const contacts = await User.find(
            { email: { $in: user.contacts || [] } },
            'name email image'
        ).lean();

        return NextResponse.json(contacts.map(contact => ({
            name: contact.name,
            email: contact.email,
            avatar: contact.image || contact.name?.substring(0, 2).toUpperCase() || '??',
        })));
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}

// POST: Add new contact
export async function POST(request: Request) {
    try {
        await dbConnect();

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { contactEmail } = body;

        if (!contactEmail || !contactEmail.includes('@')) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        // Check if contact exists
        const contactUser = await User.findOne({ email: contactEmail });
        if (!contactUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Add to contacts
        await User.findOneAndUpdate(
            { email: session.user.email },
            { $addToSet: { contacts: contactEmail } }
        );

        return NextResponse.json({
            success: true,
            contact: {
                name: contactUser.name,
                email: contactUser.email,
                avatar: contactUser.image || contactUser.name?.substring(0, 2).toUpperCase() || '??',
            }
        });
    } catch (error) {
        console.error('Error adding contact:', error);
        return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
    }
}

// DELETE: Remove contact
export async function DELETE(request: Request) {
    try {
        await dbConnect();

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const contactEmail = searchParams.get('email');

        if (!contactEmail) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        await User.findOneAndUpdate(
            { email: session.user.email },
            { $pull: { contacts: contactEmail } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing contact:', error);
        return NextResponse.json({ error: 'Failed to remove contact' }, { status: 500 });
    }
}
