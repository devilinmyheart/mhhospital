
-- HOSPITALS
CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  address text,
  city text,
  state text,
  postal_code text,
  phone text,
  email text,
  emergency_phone text,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hospitals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospitals TO authenticated;
GRANT ALL ON public.hospitals TO service_role;

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hospitals" ON public.hospitals
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Authenticated can view hospitals" ON public.hospitals
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert hospitals" ON public.hospitals
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update hospitals" ON public.hospitals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete hospitals" ON public.hospitals
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_hospitals_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER hospitals_set_updated_at BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION public.update_hospitals_updated_at();

-- Optional cross-links
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL;

-- USER_ROLES admin policies
CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can grant roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can revoke roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed the main hospital
INSERT INTO public.hospitals (name, slug, address, city, state, postal_code, phone, emergency_phone, description, is_active)
VALUES (
  'MH Hospital',
  'mh-hospital',
  'Sikarpur Road, Sinduria chauraha se 100m aage',
  'Maharajganj',
  'Uttar Pradesh',
  '273303',
  '+91 7905932721',
  '+91 7905932721',
  'Flagship MH Hospital branch — full-service care in Maharajganj.',
  true
) ON CONFLICT DO NOTHING;
