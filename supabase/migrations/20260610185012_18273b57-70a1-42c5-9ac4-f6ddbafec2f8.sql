ALTER TABLE public.watchlist
  ADD COLUMN IF NOT EXISTS home_name TEXT,
  ADD COLUMN IF NOT EXISTS away_name TEXT,
  ADD COLUMN IF NOT EXISTS home_logo TEXT,
  ADD COLUMN IF NOT EXISTS away_logo TEXT,
  ADD COLUMN IF NOT EXISTS competition_name TEXT,
  ADD COLUMN IF NOT EXISTS competition_logo TEXT,
  ADD COLUMN IF NOT EXISTS kickoff_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NS',
  ADD COLUMN IF NOT EXISTS score_home INTEGER,
  ADD COLUMN IF NOT EXISTS score_away INTEGER;

ALTER TABLE public.watchlist REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'watchlist'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlist';
  END IF;
END $$;