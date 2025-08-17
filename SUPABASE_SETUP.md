# Supabase Setup for GIF Photobooth Visitcards

## Overview
This feature adds permanent visitcard functionality to the GIF Photobooth app using Supabase for storage and database management.

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from the project settings

### 2. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your values:
```bash
cp .env.local.example .env.local
```

### 3. Database Setup
Run the SQL commands in `supabase-setup.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the contents of `supabase-setup.sql`
3. Run the queries

### 4. Storage Setup
1. Go to Storage → Create new bucket
2. Name it `gifs`
3. Make it public
4. Set up the storage policies as shown in the SQL file

### 5. Test the Implementation
1. Start your development server: `npm run dev`
2. Create a new GIF using the photobooth
3. Check that the QR code now points to a visitcard URL
4. Verify the visitcard displays correctly at `/view.html?id=<uuid>`

## Features

### Visitcard System
- **Permanent Storage**: GIFs are uploaded to Supabase Storage for permanent hosting
- **Database Metadata**: Each GIF gets a UUID and metadata stored in the database
- **Public Visitcards**: Each GIF gets a unique visitcard URL (`/view.html?id=<uuid>`)
- **QR Code Integration**: QR codes now point to visitcards instead of temporary URLs

### API Endpoints
- `POST /api/visitcards` - Create a new visitcard (upload GIF and save metadata)
- `GET /api/visitcards?id=<uuid>` - Retrieve visitcard data

### Database Schema
```sql
CREATE TABLE gifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_url TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### Storage Bucket
- **Name**: `gifs`
- **Public**: Yes
- **Policies**: Allow public read and upload

## Troubleshooting

### Common Issues
1. **Environment Variables**: Make sure your Supabase URL and key are correct
2. **Storage Bucket**: Ensure the `gifs` bucket exists and is public
3. **Database Policies**: Check that RLS policies allow public access
4. **CORS**: Ensure your domain is allowed in Supabase project settings

### Debug Steps
1. Check browser console for API errors
2. Verify Supabase connection in Network tab
3. Check Supabase logs in the dashboard
4. Test API endpoints directly with curl or Postman