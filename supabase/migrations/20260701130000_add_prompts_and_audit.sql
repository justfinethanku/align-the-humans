-- Prompt management + admin audit tables (moved from the Drizzle-only
-- drizzle/0001_add_prompts_and_audit.sql into the Supabase migration chain so
-- it is version-controlled and applied to prod alongside every other migration).
--
-- Prompts, their model slug, and generation params now live in the DB and are
-- managed via the admin dashboard instead of hardcoded seeds. RLS write access
-- is admin-only via the is_platform_admin() SECURITY DEFINER helper; the app
-- reads/writes through the Supabase service-role client (bypasses RLS).
-- Idempotent: safe to re-run.

-- Prompt configurations
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'alignment',
  model TEXT NOT NULL DEFAULT 'anthropic/claude-sonnet-4.6',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.3,
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  output_schema JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt version history
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  model TEXT NOT NULL,
  temperature NUMERIC(3,2) NOT NULL,
  max_tokens INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  output_schema JSONB,
  change_note TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(prompt_id, version)
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- is_admin already added by 20260217140000; keep idempotent for fresh DBs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_prompts_slug ON public.prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prompts_read_all" ON public.prompts;
CREATE POLICY "prompts_read_all" ON public.prompts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "prompts_write_admin" ON public.prompts;
CREATE POLICY "prompts_write_admin" ON public.prompts FOR ALL TO authenticated USING (public.is_platform_admin());

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prompt_versions_read_all" ON public.prompt_versions;
CREATE POLICY "prompt_versions_read_all" ON public.prompt_versions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "prompt_versions_write_admin" ON public.prompt_versions;
CREATE POLICY "prompt_versions_write_admin" ON public.prompt_versions FOR ALL TO authenticated USING (public.is_platform_admin());

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_admin_only" ON public.admin_audit_log;
CREATE POLICY "audit_log_admin_only" ON public.admin_audit_log FOR ALL TO authenticated USING (public.is_platform_admin());

GRANT SELECT ON public.prompts TO authenticated;
GRANT SELECT ON public.prompt_versions TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;

DROP TRIGGER IF EXISTS trg_prompts_updated_at ON public.prompts;
CREATE TRIGGER trg_prompts_updated_at BEFORE UPDATE ON public.prompts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
