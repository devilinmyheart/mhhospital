
-- 1) profiles: restrict doctor read to real, current care relationships
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
FOR SELECT USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = profiles.id
      AND d.user_id = auth.uid()
      AND a.status IN ('booked','completed')
      AND a.scheduled_at > now() - interval '180 days'
      AND a.scheduled_at < now() + interval '180 days'
  )
  OR EXISTS (
    SELECT 1 FROM public.prescriptions p
    JOIN public.doctors d ON d.id = p.doctor_id
    JOIN public.appointments a ON a.id = p.appointment_id
    WHERE p.patient_id = profiles.id
      AND d.user_id = auth.uid()
      AND a.doctor_id = d.id
  )
  OR EXISTS (
    SELECT 1 FROM public.medical_reports r
    JOIN public.doctors d ON d.id = r.doctor_id
    JOIN public.appointments a ON a.id = r.appointment_id
    WHERE r.patient_id = profiles.id
      AND d.user_id = auth.uid()
      AND a.doctor_id = d.id
  )
);

-- 2) medical_reports insert must tie to a specific appointment the doctor owns
DROP POLICY IF EXISTS "doctor uploads report" ON public.medical_reports;
CREATE POLICY "doctor uploads report" ON public.medical_reports
FOR INSERT WITH CHECK (
  doctor_id IS NOT NULL
  AND appointment_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = medical_reports.doctor_id AND d.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = medical_reports.appointment_id
      AND a.doctor_id = medical_reports.doctor_id
      AND a.patient_id = medical_reports.patient_id
  )
);

-- 3) prescriptions insert must tie to a specific appointment the doctor owns
DROP POLICY IF EXISTS "doctor issues prescription" ON public.prescriptions;
CREATE POLICY "doctor issues prescription" ON public.prescriptions
FOR INSERT WITH CHECK (
  appointment_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = prescriptions.doctor_id AND d.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = prescriptions.appointment_id
      AND a.doctor_id = prescriptions.doctor_id
      AND a.patient_id = prescriptions.patient_id
  )
);

-- 4) appointments: patient UPDATE limited to status=cancelled; trigger enforces column immutability
DROP POLICY IF EXISTS "patient cancels own appt" ON public.appointments;
CREATE POLICY "patient cancels own appt" ON public.appointments
FOR UPDATE
USING (patient_id = auth.uid() AND status = 'booked')
WITH CHECK (patient_id = auth.uid() AND status = 'cancelled');

DROP TRIGGER IF EXISTS appointments_restrict_patient_updates_trg ON public.appointments;
CREATE TRIGGER appointments_restrict_patient_updates_trg
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_restrict_patient_updates();
