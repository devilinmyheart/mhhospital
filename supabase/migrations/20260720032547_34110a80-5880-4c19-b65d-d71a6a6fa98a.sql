
-- Rejection reason
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add file_path to medical_reports
ALTER TABLE public.medical_reports ADD COLUMN IF NOT EXISTS file_path text;

-- Ophthalmology department
INSERT INTO public.departments (name, slug, code, description)
SELECT 'Ophthalmology', 'ophthalmology', 'OPH', 'Comprehensive eye and vision care, cataract surgery, and retinal treatments.'
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE slug = 'ophthalmology');

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own notifications" ON public.notifications;
CREATE POLICY "users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users update own notifications" ON public.notifications;
CREATE POLICY "users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
