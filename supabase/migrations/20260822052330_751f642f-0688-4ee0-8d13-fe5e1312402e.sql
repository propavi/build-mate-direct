ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS image_path text;

CREATE POLICY "material images readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'material-images');

CREATE POLICY "material images admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'material-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "material images admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'material-images' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'material-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "material images admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'material-images' AND public.has_role(auth.uid(), 'admin'::app_role));