import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ScanHistory from '@/lib/models/ScanHistory';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    const scanId = searchParams.get('scanId');

    if (!uuid) {
        return new NextResponse('UUID is required', { status: 400 });
    }

    try {
        const imageUrl = `https://urlscan.io/screenshots/${uuid}.png`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
            // If it's not ready yet or 404, return the error
            return new NextResponse('Screenshot not ready', { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/png';

        // Background persistence: if we have a scanId, save the base64 to DB
        if (scanId) {
            (async () => {
                try {
                    await dbConnect();
                    const base64 = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
                    await ScanHistory.findByIdAndUpdate(scanId, {
                        $set: { 'visualAnalysis.screenshotData': base64 }
                    });
                    console.log(`[Proxy] Persisted screenshot for ${scanId}`);
                } catch (e) {
                    console.error('[Proxy] Persistence error:', e);
                }
            })();
        }

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            },
        });
    } catch (error) {
        console.error('[Proxy] Fetch error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
