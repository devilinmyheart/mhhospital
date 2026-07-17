ALTER TABLE public.doctor_availability
  ADD COLUMN IF NOT EXISTS break_start time without time zone,
  ADD COLUMN IF NOT EXISTS break_end time without time zone,
  ADD COLUMN IF NOT EXISTS slot_duration_min integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS max_bookings_per_slot integer NOT NULL DEFAULT 1;

ALTER TABLE public.doctor_availability
  DROP CONSTRAINT IF EXISTS doctor_availability_break_check;
ALTER TABLE public.doctor_availability
  ADD CONSTRAINT doctor_availability_break_check
  CHECK (
    (break_start IS NULL AND break_end IS NULL)
    OR (break_start IS NOT NULL AND break_end IS NOT NULL
        AND break_end > break_start
        AND break_start >= start_time
        AND break_end <= end_time)
  );

ALTER TABLE public.doctor_availability
  DROP CONSTRAINT IF EXISTS doctor_availability_slot_dur_check;
ALTER TABLE public.doctor_availability
  ADD CONSTRAINT doctor_availability_slot_dur_check
  CHECK (slot_duration_min BETWEEN 5 AND 240);

ALTER TABLE public.doctor_availability
  DROP CONSTRAINT IF EXISTS doctor_availability_max_bookings_check;
ALTER TABLE public.doctor_availability
  ADD CONSTRAINT doctor_availability_max_bookings_check
  CHECK (max_bookings_per_slot BETWEEN 1 AND 20);