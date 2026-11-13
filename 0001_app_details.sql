ALTER TABLE public.apps
  ADD COLUMN site_id uuid,
  ADD COLUMN description text,
  ADD COLUMN specs text,
  ADD COLUMN images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN download_url text,
  ADD COLUMN license text NOT NULL DEFAULT 'free',
  ADD COLUMN price numeric,
  ADD COLUMN size_mb numeric,
  ADD COLUMN release_date date,
  ADD COLUMN update_date date;