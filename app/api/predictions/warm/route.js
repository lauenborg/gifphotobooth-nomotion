import { NextResponse } from "next/server";
import Replicate from "replicate";
import { readFile } from "fs/promises";
import path from "path";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request) {
    const logs = [];
    
    try {
        if (!process.env.REPLICATE_API_TOKEN) {
            logs.push('ERROR: The REPLICATE_API_TOKEN environment variable is not set.');
            return NextResponse.json(
                { error: 'The REPLICATE_API_TOKEN environment variable is not set.', logs },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { source, target } = body;

        if (!source || !target) {
            logs.push('ERROR: Both source and target are required for warming');
            return NextResponse.json(
                { error: 'Both source and target are required for warming', logs },
                { status: 400 }
            );
        }

        logs.push('Starting API warming...');
        console.log('Starting API warming...');

        // Convert local GIF path to data URI for warming
        let targetData;
        if (target.startsWith('http')) {
            targetData = target;
            logs.push(`Using HTTP target: ${target}`);
        } else {
            try {
                const gifPath = path.join(process.cwd(), 'public', target);
                const gifBuffer = await readFile(gifPath);
                const gifBase64 = gifBuffer.toString('base64');
                targetData = `data:image/gif;base64,${gifBase64}`;
            } catch (fileError) {
                const errorMsg = `Error reading GIF file for warming: ${fileError.message}`;
                logs.push(`ERROR: ${errorMsg}`);
                console.error('Error reading GIF file for warming:', fileError);
                return NextResponse.json(
                    { error: `Failed to read GIF file for warming: ${target}`, logs },
                    { status: 400 }
                );
            }
        }

        // Create a warming prediction - we don't need webhooks for this
        const warmingOptions = {
            version: "974be35318aab27d78c8c935761e665620236d3b157a9b35385c7905c601d977",
            input: {
                source: source, // Small dummy image
                target: targetData // Small reference GIF
            }
        };

        logs.push('Creating warming prediction...');
        console.log('Creating warming prediction...');

        // Create the warming prediction
        const prediction = await replicate.predictions.create(warmingOptions);

        logs.push(`Warming prediction created: ${prediction.id}`);
        console.log('Warming prediction created:', prediction.id);

        // For warming, we don't wait for completion - just starting the prediction
        // is enough to warm up the model infrastructure
        return NextResponse.json({ 
            success: true,
            predictionId: prediction.id,
            message: 'Model warming initiated',
            logs
        }, { status: 200 });

    } catch (error) {
        const errorMsg = `API Warming Error: ${error.message}`;
        logs.push(`ERROR: ${errorMsg}`);
        console.error('API Warming Error:', error);
        
        // Don't fail hard on warming errors - log and continue
        return NextResponse.json(
            { 
                success: false, 
                error: 'Warming failed but continuing normally',
                details: error.message,
                logs 
            },
            { status: 200 } // Return 200 so main app continues working
        );
    }
}