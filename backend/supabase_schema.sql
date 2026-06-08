-- Supabase Database Schema for CMS (Events & Gallery)
-- Paste this script into the Supabase SQL Editor and execute it.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_date TEXT NOT NULL, -- Stored as string to match existing design or allow freeform dates
    venue TEXT NOT NULL,
    description TEXT NOT NULL,
    poster_url TEXT NOT NULL, -- Main cover image reference (Cloudflare R2 public URL)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Event Images Table (for multiple images in event sliders)
CREATE TABLE IF NOT EXISTS public.event_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Image reference (Cloudflare R2 public URL)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Gallery Table
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT, -- Optional caption or title
    image_url TEXT NOT NULL, -- Image reference (Cloudflare R2 public URL)
    category TEXT, -- Optional category filter (e.g., 'sports', 'cultural', etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Create Public Access Policies (Allow anyone to read events and gallery items)
CREATE POLICY "Allow public read access to events" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to event_images" ON public.event_images
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to gallery" ON public.gallery
    FOR SELECT USING (true);

-- Create Full Control Policies for authenticated/service role (Allows backend to perform CRUD operations)
CREATE POLICY "Allow full access for service_role to events" ON public.events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for service_role to event_images" ON public.event_images
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for service_role to gallery" ON public.gallery
    FOR ALL TO service_role USING (true) WITH CHECK (true);

