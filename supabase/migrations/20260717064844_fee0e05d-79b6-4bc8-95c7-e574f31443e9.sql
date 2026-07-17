
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'pending'::appointment_status;

DROP POLICY IF EXISTS "patient cancels own appt" ON public.appointments;
CREATE POLICY "patient cancels own appt" ON public.appointments
  FOR UPDATE
  USING (patient_id = auth.uid() AND status IN ('pending'::appointment_status, 'booked'::appointment_status))
  WITH CHECK (patient_id = auth.uid() AND status = 'cancelled'::appointment_status);
