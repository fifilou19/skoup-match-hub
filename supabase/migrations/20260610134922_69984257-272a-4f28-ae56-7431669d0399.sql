
-- Table analyses
CREATE TABLE public.analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  profile_code TEXT NOT NULL,
  profile_label TEXT NOT NULL,
  score_axe1 NUMERIC(4,2) NOT NULL,
  score_axe2 NUMERIC(4,2) NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('HAUTE','MOYENNE','BASSE')),
  context_text TEXT NOT NULL,
  scenario_label TEXT NOT NULL,
  scenario_text TEXT NOT NULL,
  has_press_conference BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON public.analyses TO anon, authenticated;
GRANT ALL ON public.analyses TO service_role;

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analyses lisibles par tous"
  ON public.analyses FOR SELECT
  USING (true);

-- Table predictions
CREATE TABLE public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  event_code TEXT NOT NULL,
  event_name TEXT NOT NULL,
  threshold TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('binaire','intervalle')),
  interval_text TEXT,
  probability NUMERIC(4,3) NOT NULL,
  reasoning TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON public.predictions TO anon, authenticated;
GRANT ALL ON public.predictions TO service_role;

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions lisibles par tous"
  ON public.predictions FOR SELECT
  USING (true);

-- Table watchlist
CREATE TABLE public.watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Watchlist par utilisateur"
  ON public.watchlist FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table daily_quota
CREATE TABLE public.daily_quota (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quota_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, quota_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_quota TO authenticated;
GRANT ALL ON public.daily_quota TO service_role;

ALTER TABLE public.daily_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quota par utilisateur"
  ON public.daily_quota FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
