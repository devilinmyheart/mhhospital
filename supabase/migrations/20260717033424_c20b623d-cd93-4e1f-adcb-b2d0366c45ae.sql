
-- 1. Simplify user_roles SELECT policy (remove recursion through has_role)
DROP POLICY IF EXISTS "users see their own roles" ON public.user_roles;
CREATE POLICY "users see their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2. Switch has_role to SECURITY INVOKER; revoke from anon/public, keep for authenticated
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- 3. doctor_availability: restrict SELECT to authenticated
DROP POLICY IF EXISTS "availability public read" ON public.doctor_availability;
CREATE POLICY "availability authenticated read" ON public.doctor_availability
  FOR SELECT TO authenticated
  USING (true);

-- 4. medical_reports: UPDATE + DELETE (uploading doctor or admin)
CREATE POLICY "doctor updates report" ON public.medical_reports
  FOR UPDATE TO authenticated
  USING (
    (doctor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.doctors d WHERE d.id = medical_reports.doctor_id AND d.user_id = auth.uid()
    )) OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    (doctor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.doctors d WHERE d.id = medical_reports.doctor_id AND d.user_id = auth.uid()
    )) OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "doctor deletes report" ON public.medical_reports
  FOR DELETE TO authenticated
  USING (
    (doctor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.doctors d WHERE d.id = medical_reports.doctor_id AND d.user_id = auth.uid()
    )) OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 5. prescriptions: DELETE (issuing doctor or admin)
CREATE POLICY "doctor deletes prescription" ON public.prescriptions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d WHERE d.id = prescriptions.doctor_id AND d.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin'::app_role)
  );
