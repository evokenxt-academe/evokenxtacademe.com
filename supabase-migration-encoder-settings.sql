-- Encoder / OBS settings stored per admin user (admin-only via RLS)

CREATE TABLE IF NOT EXISTS public.stream_encoder_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
    obs_host TEXT NOT NULL DEFAULT 'localhost',
    obs_port INT NOT NULL DEFAULT 4455,
    obs_password TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stream_encoder_settings IS 'Per-admin OBS/encoder connection preferences for live streaming.';

ALTER TABLE public.stream_encoder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_own_encoder_settings_select"
  ON public.stream_encoder_settings FOR SELECT TO authenticated
  USING (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY "admin_own_encoder_settings_insert"
  ON public.stream_encoder_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY "admin_own_encoder_settings_update"
  ON public.stream_encoder_settings FOR UPDATE TO authenticated
  USING (public.is_admin () AND user_id = auth.uid ())
  WITH CHECK (public.is_admin () AND user_id = auth.uid ());

CREATE POLICY "admin_own_encoder_settings_delete"
  ON public.stream_encoder_settings FOR DELETE TO authenticated
  USING (public.is_admin () AND user_id = auth.uid ());

CREATE TRIGGER trg_encoder_settings_updated_at
  BEFORE UPDATE ON public.stream_encoder_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
