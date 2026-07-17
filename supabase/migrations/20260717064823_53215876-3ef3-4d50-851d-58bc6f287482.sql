
-- Add pending & rejected statuses to enum
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'booked';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'rejected';
