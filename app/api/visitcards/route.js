import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";

export async function POST(request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.' },
        { status: 500 }
      );
    }
    const body = await request.json();
    const { gifUrl, metadata = {} } = body;

    if (!gifUrl) {
      return NextResponse.json(
        { error: 'GIF URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(gifUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid GIF URL format' },
        { status: 400 }
      );
    }

    // Fetch the GIF from the temporary URL
    const response = await fetch(gifUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch GIF: ${response.status}`);
    }

    const gifBuffer = await response.arrayBuffer();
    const fileName = `gif-${Date.now()}-${Math.random().toString(36).substring(7)}.gif`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gifs')
      .upload(fileName, gifBuffer, {
        contentType: 'image/gif',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload GIF to storage' },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('gifs')
      .getPublicUrl(fileName);

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from('gifs')
      .insert({
        original_url: gifUrl,
        storage_url: publicUrl,
        file_name: fileName,
        file_size: gifBuffer.byteLength,
        metadata: metadata
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save GIF metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: dbData.id,
      storageUrl: publicUrl,
      viewUrl: `/view?id=${dbData.id}`,
      metadata: dbData
    });

  } catch (error) {
    console.error('Visitcard creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.' },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('gifs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Visitcard not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Visitcard fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}