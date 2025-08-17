-- Disable Row Level Security completely for the gifs table
ALTER TABLE gifs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'gifs';