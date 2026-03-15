import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import ThreatModel from '@/lib/models/Threat';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                await dbConnect();

                // Setup Change Stream
                const changeStream = ThreatModel.watch([], { fullDocument: 'updateLookup' });

                // Pulse function to keep connection alive
                const pulseInterval = setInterval(() => {
                    controller.enqueue(encoder.encode(': pulse\n\n'));
                }, 30000);

                changeStream.on('change', (change) => {
                    if (change.operationType === 'insert') {
                        const threat = change.fullDocument;
                        const data = `data: ${JSON.stringify(threat)}\n\n`;
                        controller.enqueue(encoder.encode(data));
                    }
                });

                changeStream.on('error', (error) => {
                    console.error('Change Stream Error:', error);
                    clearInterval(pulseInterval);
                    controller.error(error);
                });

                // Handle closure
                req.signal.onabort = () => {
                    console.log('Client disconnected from threat events');
                    clearInterval(pulseInterval);
                    changeStream.close();
                    controller.close();
                };

            } catch (error) {
                console.error('SSE Error:', error);
                controller.error(error);
            }
        },
        cancel() {
            console.log('Stream cancelled');
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
