DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','sites','apps','tickets','security_checks'] LOOP
    EXECUTE format('CREATE TABLE public.%I (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL DEFAULT auth.uid(),
      title text NOT NULL,
      client text,
      url text,
      status text NOT NULL DEFAULT ''new'',
      notes text,
      created_at timestamptz NOT NULL DEFAULT now()
    )', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own rows" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t);
  END LOOP;
END $$;