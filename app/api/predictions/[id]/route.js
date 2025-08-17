import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function GET(request, { params }) {
    try {
        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json(
                { error: 'The REPLICATE_API_TOKEN environment variable is not set.' },
                { status: 500 }
            );
        }

        const { id } = await params;
        const prediction = await replicate.predictions.get(id);

        if (prediction?.error) {
            return NextResponse.json({ error: prediction.error }, { status: 500 });
        }

        return NextResponse.json(prediction);
    } catch (error) {
        console.error('Error fetching prediction:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prediction', details: error.message },
            { status: 500 }
        );
    }
}