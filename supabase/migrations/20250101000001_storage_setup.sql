-- Storage bucket setup for papers
-- Run this after creating the Supabase project

-- Create storage bucket for papers (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('papers', 'papers', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for papers bucket
CREATE POLICY "Users can upload their own papers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'papers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own papers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'papers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own papers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'papers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own papers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'papers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

