-- Enable RLS on all tables and restrict access to service_role only.
-- Auth is handled server-side via Clerk in API routes.
-- The anon key (exposed to browser via NEXT_PUBLIC_) gets zero access.
-- The service_role key (server-side only) bypasses these policies.

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['projects', 'sessions', 'evaluations', 'study_cards', 'user_api_keys'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_service_role_policy" ON public.%I', t, t);
  END LOOP;
END $$;

-- Projects: service_role only
CREATE POLICY "projects_service_role_policy" ON public.projects
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Sessions: service_role only
CREATE POLICY "sessions_service_role_policy" ON public.sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Evaluations: service_role only
CREATE POLICY "evaluations_service_role_policy" ON public.evaluations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Study cards: service_role only
CREATE POLICY "study_cards_service_role_policy" ON public.study_cards
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- User API keys: service_role only
CREATE POLICY "user_api_keys_service_role_policy" ON public.user_api_keys
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
