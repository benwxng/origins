-- Storage policies for the family-photos bucket
-- Run this in your Supabase SQL Editor

-- Allow authenticated users to upload family photos
CREATE POLICY "Allow authenticated users to upload family photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'family-photos');

-- Allow authenticated users to view family photos
CREATE POLICY "Allow authenticated users to view family photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'family-photos');

-- Allow users to update their own uploaded photos
CREATE POLICY "Allow users to update their own photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploaded photos
CREATE POLICY "Allow users to delete their own photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'family-photos' AND auth.uid()::text = (storage.foldername(name))[1]); 