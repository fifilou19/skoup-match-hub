-- Add snapshot columns to watchlist so /follows doesn't need extra API calls
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
