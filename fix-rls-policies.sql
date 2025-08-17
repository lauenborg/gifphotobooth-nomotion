-- First, let's drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to gifs" ON gifs;
DROP POLICY IF EXISTS "Allow public insert access to gifs" ON gifs;

-- Disable RLS temporarily to clean up
ALTER TABLE gifs DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE gifs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read gifs (for public visitcards)
CREATE POLICY "Allow public read access to gifs" ON gifs
  FOR SELECT 
  TO public
  USING (true);

-- Create a policy that allows anyone to insert gifs (for creating new gifs)
CREATE POLICY "Allow public insert access to gifs" ON gifs
  FOR INSERT 
  TO public
  WITH CHECK (true);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'gifs';