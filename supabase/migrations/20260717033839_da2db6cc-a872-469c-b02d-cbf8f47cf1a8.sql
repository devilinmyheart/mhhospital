
-- Fix profiles: doctors can only read profiles of patients with a care relationship
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
FOR SELECT USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = profiles.id AND d.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.prescriptions p
    JOIN public.doctors d ON d.id = p.doctor_id
    WHERE p.patient_id = profiles.id AND d.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.medical_reports r
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE r.patient_id = profiles.id AND d.user_id = auth.uid()
  )
);

-- Fix appointments: split patient update (cancel only) from doctor/admin full update
DROP POLICY IF EXISTS "patient/doctor update appt" ON public.appointments;

CREATE POLICY "patient cancels own appt" ON public.appointments
FOR UPDATE USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());

CREATE OR REPLACE FUNCTION public.appointments_restrict_patient_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_treating_doctor boolean;
  is_admin boolean;
BEGIN
  is_admin := has_role(auth.uid(), 'admin'::app_role);
  SELECT EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = OLD.doctor_id AND d.user_id = auth.uid()
  ) INTO is_treating_doctor;

  IF is_admin OR is_treating_doctor THEN
    RETURN NEW;
  END IF;

  -- Patient path: allow only status changes to 'cancelled' and no other field edits
  IF NEW.doctor_id IS DISTINCT FROM OLD.doctor_id
     OR NEW.department_id IS DISTINCT FROM OLD.department_id
     OR NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at
     OR NEW.notes IS DISTINCT FROM OLD.notes
     OR NEW.mode IS DISTINCT FROM OLD.mode
     OR NEW.patient_id IS DISTINCT FROM OLD.patient_id THEN
    RAISE EXCEPTION 'Patients can only cancel appointments';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Patients can only set status to cancelled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_restrict_patient_updates ON public.appointments;
CREATE TRIGGER appointments_restrict_patient_updates
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_restrict_patient_updates();

CREATE POLICY "doctor/admin update appt" ON public.appointments
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = appointments.doctor_id AND d.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = appointments.doctor_id AND d.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix medical_reports insert: require an appointment relationship
DROP POLICY IF EXISTS "doctor uploads report" ON public.medical_reports;
CREATE POLICY "doctor uploads report" ON public.medical_reports
FOR INSERT WITH CHECK (
  doctor_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = medical_reports.doctor_id AND d.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.doctor_id = medical_reports.doctor_id
      AND a.patient_id = medical_reports.patient_id
  )
);

-- Fix prescriptions insert: require an appointment relationship
DROP POLICY IF EXISTS "doctor issues prescription" ON public.prescriptions;
CREATE POLICY "doctor issues prescription" ON public.prescriptions
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = prescriptions.doctor_id AND d.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.doctor_id = prescriptions.doctor_id
      AND a.patient_id = prescriptions.patient_id
  )
);
