
DROP POLICY IF EXISTS "patient_files admin read" ON storage.objects;
DROP POLICY IF EXISTS "patient_files admin write" ON storage.objects;
DROP POLICY IF EXISTS "patient_files admin update" ON storage.objects;
DROP POLICY IF EXISTS "patient_files admin delete" ON storage.objects;
DROP POLICY IF EXISTS "patient_files owner read" ON storage.objects;

CREATE POLICY "patient_files admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'patient-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "patient_files admin write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "patient_files admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "patient_files admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'patient-files' AND public.has_role(auth.uid(), 'admin'));

-- Owner path: files are stored as "<patient_user_id>/..."; owner reads through storage.
CREATE POLICY "patient_files owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'patient-files' AND (storage.foldername(name))[1] = auth.uid()::text);
