
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  relation text CHECK (relation IS NULL OR char_length(relation) <= 80),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  quote text NOT NULL CHECK (char_length(quote) BETWEEN 10 AND 600),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read approved reviews" ON public.reviews
  FOR SELECT TO anon USING (approved = true);

CREATE POLICY "auth read approved or own reviews" ON public.reviews
  FOR SELECT TO authenticated USING (approved = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "auth insert own review" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND approved = false);

CREATE POLICY "admin update reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin delete reviews" ON public.reviews
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS reviews_approved_created_idx ON public.reviews(approved, created_at DESC);
