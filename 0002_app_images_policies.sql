CREATE POLICY "own app images" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'app-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'app-images' AND (storage.foldername(name))[1] = auth.uid()::text);