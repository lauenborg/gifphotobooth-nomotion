import { readdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const gifsDirectory = join(process.cwd(), 'public', 'gifs');
    console.log('Looking for gifs in:', gifsDirectory);
    
    const filenames = await readdir(gifsDirectory);
    console.log('Found files:', filenames);
    
    // Filter only .gif files
    const gifs = filenames.filter(name => name.toLowerCase().endsWith('.gif'));
    console.log('Filtered gifs:', gifs);
    
    return NextResponse.json({ gifs });
  } catch (error) {
    console.error('Error reading gifs directory:', error);
    return NextResponse.json({ error: 'Failed to load gifs', details: error.message }, { status: 500 });
  }
}