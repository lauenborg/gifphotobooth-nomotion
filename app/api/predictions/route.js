import { NextResponse } from "next/server";
import Replicate from "replicate";
import { readFile } from "fs/promises";
import path from "path";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// In production and preview deployments (on Vercel), the VERCEL_URL environment variable is set.
// In development (on your local machine), the NGROK_HOST environment variable is set.
const WEBHOOK_HOST = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NGROK_HOST;

export async function POST(request) {
    try {
        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json(
                { error: 'The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it.' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { source, target } = body;

        if (!source || !target) {
            return NextResponse.json(
                { error: 'Both source and target are required' },
                { status: 400 }
            );
        }

        console.log('Creating prediction with:', { 
            source: source.startsWith('data:') ? 'base64 image data' : source, 
            target 
        });

        // Convert local GIF path to data URI since Replicate can't access localhost
        let targetData;
        if (target.startsWith('http')) {
            targetData = target;
        } else {
            // Read the GIF file and convert to data URI
            const gifPath = path.join(process.cwd(), 'public', target);
            console.log('Reading GIF file from:', gifPath);
            
            try {
                const gifBuffer = await readFile(gifPath);
                const gifBase64 = gifBuffer.toString('base64');
                targetData = `data:image/gif;base64,${gifBase64}`;
                console.log('Converted GIF to data URI');
            } catch (fileError) {
                console.error('Error reading GIF file:', fileError);
                return NextResponse.json(
                    { error: `Failed to read GIF file: ${target}` },
                    { status: 400 }
                );
            }
        }

        const options = {
            version: "974be35318aab27d78c8c935761e665620236d3b157a9b35385c7905c601d977",
            input: {
                source: source, // base64 data URI from webcam/upload
                target: targetData // base64 data URI from GIF file
            }
        };

        if (WEBHOOK_HOST) {
            options.webhook = `${WEBHOOK_HOST}/api/webhooks`;
            options.webhook_events_filter = ["start", "completed"];
        }

        console.log('Creating prediction with options:', {
            version: options.version,
            inputKeys: Object.keys(options.input),
            hasWebhook: !!options.webhook
        });

        // Create prediction (async operation)
        const prediction = await replicate.predictions.create(options);

        console.log('Prediction created:', prediction);

        if (prediction?.error) {
            console.error('Replicate error:', prediction.error);
            return NextResponse.json({ error: prediction.error }, { status: 500 });
        }

        // Return the prediction details - this will include a URL to check status
        return NextResponse.json(prediction, { status: 201 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}