
-- 1) Attach patient-update restriction trigger on appointments
DROP TRIGGER IF EXISTS appointments_restrict_patient_updates_trg ON public.appointments;
CREATE TRIGGER appointments_restrict_patient_updates_trg
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_restrict_patient_updates();

-- 2) Tighten prescriptions INSERT to require active care relationship
DROP POLICY IF EXISTS "doctor issues prescription" ON public.prescriptions;
CREATE POLICY "doctor issues prescription" ON public.prescriptions
FOR INSERT TO authenticated
WITH CHECK (
  appointment_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = prescriptions.doctor_id AND d.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = prescriptions.appointment_id
      AND a.doctor_id = prescriptions.doctor_id
      AND a.patient_id = prescriptions.patient_id
      AND (
        a.status = 'completed'::appointment_status
        OR (a.status = 'booked'::appointment_status
            AND a.scheduled_at BETWEEN (now() - interval '3 hours') AND (now() + interval '1 hour'))
      )
      AND a.scheduled_at > (now() - interval '30 days')
  )
);

-- 3) Tighten medical_reports INSERT to require active care relationship
DROP POLICY IF EXISTS "doctor uploads report" ON public.medical_reports;
CREATE POLICY "doctor uploads report" ON public.medical_reports
FOR INSERT TO authenticated
WITH CHECK (
  doctor_id IS NOT NULL
  AND appointment_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = medical_reports.doctor_id AND d.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = medical_reports.appointment_id
      AND a.doctor_id = medical_reports.doctor_id
      AND a.patient_id = medical_reports.patient_id
      AND (
        a.status = 'completed'::appointment_status
        OR (a.status = 'booked'::appointment_status
            AND a.scheduled_at BETWEEN (now() - interval '3 hours') AND (now() + interval '1 hour'))
      )
      AND a.scheduled_at > (now() - interval '30 days')
  )
);

-- 4) Tighten profiles SELECT: doctors only see patients with an appointment within ±2 days
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.patient_id = profiles.id
      AND d.user_id = auth.uid()
      AND a.status IN ('booked'::appointment_status, 'completed'::appointment_status)
      AND a.scheduled_at BETWEEN (now() - interval '2 days') AND (now() + interval '2 days')
  )
);
