
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE public.appointment_mode AS ENUM ('in_person', 'video');
CREATE TYPE public.appointment_status AS ENUM ('booked', 'completed', 'cancelled');

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see their own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Trigger: on signup, create profile + assign patient role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= DEPARTMENTS =============
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments public read" ON public.departments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "departments admin write" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= DOCTORS =============
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  bio TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctors TO anon, authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors public read active" ON public.doctors FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "doctors admin write" ON public.doctors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "doctors self update" ON public.doctors FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============= DOCTOR AVAILABILITY =============
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
GRANT SELECT ON public.doctor_availability TO anon, authenticated;
GRANT ALL ON public.doctor_availability TO service_role;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability public read" ON public.doctor_availability FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "availability doctor write" ON public.doctor_availability FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============= APPOINTMENTS =============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 30,
  mode appointment_mode NOT NULL DEFAULT 'in_person',
  status appointment_status NOT NULL DEFAULT 'booked',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, scheduled_at)
);
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient sees own appts" ON public.appointments FOR SELECT TO authenticated
  USING (patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "patient books" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());
CREATE POLICY "patient/doctor update appt" ON public.appointments FOR UPDATE TO authenticated
  USING (patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

-- ============= PRESCRIPTIONS =============
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  refills_remaining INT NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescriptions read" ON public.prescriptions FOR SELECT TO authenticated
  USING (patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "doctor issues prescription" ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "doctor updates prescription" ON public.prescriptions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));

-- ============= MEDICAL REPORTS =============
CREATE TABLE public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  file_path TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.medical_reports TO authenticated;
GRANT ALL ON public.medical_reports TO service_role;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports read" ON public.medical_reports FOR SELECT TO authenticated
  USING (patient_id = auth.uid()
    OR (doctor_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "doctor uploads report" ON public.medical_reports FOR INSERT TO authenticated
  WITH CHECK (doctor_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));

-- ============= SEED DEPARTMENTS =============
INSERT INTO public.departments (name, slug, code, description) VALUES
  ('Cardiology', 'cardiology', 'DEP_01', 'Advanced heart care, diagnostics, and cardiovascular surgery.'),
  ('Neurology', 'neurology', 'DEP_02', 'Diagnosis and treatment of brain, spine, and nervous system disorders.'),
  ('Oncology', 'oncology', 'DEP_03', 'Precision cancer treatment, radiation, chemotherapy, and follow-up care.'),
  ('Orthopedics', 'orthopedics', 'DEP_04', 'Bones, joints, and ligament care. Sports medicine and joint replacement.'),
  ('Pediatrics', 'pediatrics', 'DEP_05', 'Comprehensive care for infants, children, and adolescents.'),
  ('General Practice', 'general-practice', 'DEP_06', 'Primary care, routine checkups, chronic condition management.'),
  ('Dermatology', 'dermatology', 'DEP_07', 'Skin, hair, and nail conditions. Cosmetic and medical dermatology.'),
  ('Radiology', 'radiology', 'DEP_08', 'Imaging services including MRI, CT, ultrasound, and X-ray.');

-- ============= SEED DOCTORS =============
INSERT INTO public.doctors (full_name, title, department_id, bio)
SELECT * FROM (
  VALUES
    ('Dr. Sarah Jenkins', 'Chief of Cardiology, MD/PhD', (SELECT id FROM public.departments WHERE slug='cardiology'), 'Board-certified cardiologist with 18 years of experience in interventional cardiology.'),
    ('Dr. Marcus Vane', 'Senior Neurologist', (SELECT id FROM public.departments WHERE slug='neurology'), 'Specialist in stroke care, epilepsy, and neurodegenerative disorders.'),
    ('Dr. Khurshid Alam', 'Oncologist', (SELECT id FROM public.departments WHERE slug='oncology'), 'Focus on targeted therapy for solid tumors and precision oncology.'),
    ('Dr. Elena Rodriguez', 'Orthopedic Surgeon', (SELECT id FROM public.departments WHERE slug='orthopedics'), 'Joint replacement and sports injury reconstruction.'),
    ('Dr. Nina Okafor', 'Pediatrician', (SELECT id FROM public.departments WHERE slug='pediatrics'), 'General pediatric care and adolescent medicine.'),
    ('Dr. Julian Reyes', 'General Practitioner', (SELECT id FROM public.departments WHERE slug='general-practice'), 'Primary care, preventive medicine, and telemedicine consults.')
) AS t(full_name, title, department_id, bio);

-- Availability: every seeded doctor works Mon-Fri 09:00-17:00
INSERT INTO public.doctor_availability (doctor_id, weekday, start_time, end_time)
SELECT d.id, w, '09:00'::time, '17:00'::time
FROM public.doctors d
CROSS JOIN generate_series(1,5) w;
