-- Create the gifs table to store metadata
CREATE TABLE IF NOT EXISTS gifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_url TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE gifs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read gifs (for public visitcards)
CREATE POLICY "Allow public read access to gifs" ON gifs
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert gifs (for creating new gifs)
CREATE POLICY "Allow public insert access to gifs" ON gifs
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for gifs (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gifs', 'gifs', true);

-- Create storage policy for public access
-- CREATE POLICY "Allow public read access to gif files" ON storage.objects
--   FOR SELECT USING (bucket_id = 'gifs');

-- CREATE POLICY "Allow public upload of gif files" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'gifs');