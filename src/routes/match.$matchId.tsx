import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Eye,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

import { TeamLogo } from "@/components/skoup/TeamLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getFixtureById } from "@/lib/apiFootball.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/match/$matchId")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: (s.status === "finished" ? "finished" : undefined) as
      | "finished"
      | undefined,
  }),
  component: MatchDetail,
});

// ---------- Helpers ----------

const STORAGE_PREFIX = "analysis_";

type StoredAnalysis = {
  profile_code?: string;
  profile_label: string;
  scenario_label?: string;
  scenario_text: string;
  context_text: string;
  confidence?: "HAUTE" | "MOYENNE" | "BASSE" | string;
  score_axe1?: number;
  score_axe2?: number;
  predictions: Array<{
    event_name: string;
    threshold: string;
    event_type: string;
    interval_text?: string | null;
    reasoning: string;
    probability?: number | null;
    display_order?: number;
  }>;
};


function loadStoredAnalysis(matchId: string): StoredAnalysis | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + matchId);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAnalysis;
  } catch {
    return null;
  }
}

function saveStoredAnalysis(matchId: string, data: StoredAnalysis) {
  try {
    localStorage.setItem(STORAGE_PREFIX + matchId, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatKickoffTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Aujourd'hui";
  if (sameDay(d, tomorrow)) return "Demain";
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = [
    "jan", "fév", "mar", "avr", "mai", "juin",
    "juil", "août", "sept", "oct", "nov", "déc",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatFinishedDate(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

// ---------- Component ----------

function MatchDetail() {
  const { matchId } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();

  const fetchFixture = useServerFn(getFixtureById);
  const fixtureId = parseInt(matchId, 10);
  const validId = Number.isFinite(fixtureId) && fixtureId > 0;

  const { data: fixtureResp, isLoading: loadingFixture, isError } = useQuery({
    queryKey: ["fixture", matchId],
    queryFn: () => fetchFixture({ data: { fixtureId } }),
    enabled: validId,
    staleTime: 60_000,
  });

  const match = fixtureResp?.match ?? null;
  const isFinished = match
    ? FINISHED_STATUSES.has(match.status)
    : false;

  const [watched, setWatched] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  // Check if match is in user's watchlist on load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", userId)
        .eq("match_id", matchId.toString())
        .maybeSingle();
      if (!cancelled) setWatched(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const handleToggleWatch = async () => {
    if (watchLoading || !match) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      toast.error("Connecte-toi pour suivre ce match");
      return;
    }
    setWatchLoading(true);
    try {
      if (!watched) {
        const { error } = await supabase.from("watchlist").insert({
          user_id: userId,
          match_id: matchId.toString(),
          home_name: match.home.name,
          away_name: match.away.name,
          home_logo: match.home.logo,
          away_logo: match.away.logo,
          competition_name: match.leagueName,
          competition_logo: match.leagueLogo,
          kickoff_at: match.kickoff,
          status: match.status,
          score_home: match.goalsHome,
          score_away: match.goalsAway,
        });
        if (error) throw error;
        setWatched(true);
        toast.success("Match ajouté aux suivis ✓");
      } else {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", userId)
          .eq("match_id", matchId.toString());
        if (error) throw error;
        setWatched(false);
        toast("Match retiré des suivis");
      }
    } catch (e) {
      console.error("watchlist toggle failed", e);
      toast.error("Action impossible, réessaie.");
    } finally {
      setWatchLoading(false);
    }
  };
  const [stored, setStored] = useState<StoredAnalysis | null>(() => {
    const local = loadStoredAnalysis(matchId);
    if (
      local &&
      local.profile_code !== "PENDING" &&
      local.predictions?.length > 0
    ) {
      return local;
    }
    return null;
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [contextText, setContextText] = useState<string | null>(
    stored?.context_text ?? null
  );
  const [contextLoading, setContextLoading] = useState(false);

  // If no valid local analysis, try to recover one from Supabase
  useEffect(() => {
    if (stored) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: remote } = await supabase
          .from("analyses")
          .select("*, predictions(*)")
          .eq("match_id", matchId.toString())
          .maybeSingle();
        if (cancelled || !remote) return;
        if (
          remote.profile_code === "PENDING" ||
          !remote.predictions ||
          remote.predictions.length === 0
        ) {
          return;
        }
        const mapped: StoredAnalysis = {
          profile_code: remote.profile_code,
          profile_label: remote.profile_label,
          score_axe1: remote.score_axe1,
          score_axe2: remote.score_axe2,
          confidence: remote.confidence,
          context_text: remote.context_text,
          scenario_label: remote.scenario_label,
          scenario_text: remote.scenario_text,
          predictions: (remote.predictions as any[])
            .map((p) => ({
              event_name: p.event_name,
              threshold: p.threshold,
              event_type: p.event_type,
              interval_text: p.interval_text,
              reasoning: p.reasoning,
              probability:
                typeof p.probability === "number" ? p.probability : null,
              display_order: p.display_order,
            }))
            .sort(
              (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
            ),
        };
        saveStoredAnalysis(matchId, mapped);
        if (!cancelled) {
          setStored(mapped);
          if (mapped.context_text) setContextText(mapped.context_text);
        }
      } catch (e) {
        console.log("Analyse non trouvée en base:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId, stored]);


  // Auto-generate context once the match is loaded (upcoming only)
  useEffect(() => {
    if (!match || isFinished || contextText) return;
    let cancelled = false;
    setContextLoading(true);
    supabase.functions
      .invoke("generate-context", { body: { match_id: matchId } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("generate-context failed", error);
          setContextText(
            `${match.home.name} affronte ${match.away.name} dans le cadre de ${match.leagueName}.`
          );
        } else {
          setContextText(
            (data as { context_text?: string } | null)?.context_text || null
          );
        }
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [match, isFinished, matchId, contextText]);

  const analyzed = stored !== null;
  const showAnalysis = (isFinished && !!match) || analyzed;

  const handleBack = () => {
    if (window.history.length > 1) router.history.back();
    else navigate({ to: "/" });
  };

  const handleAnalyze = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("Connecte-toi pour lancer une analyse.");
      navigate({ to: "/auth" });
      return;
    }

    setAnalyzing(true);
    try {
      const { data: res, error } = await supabase.functions.invoke(
        "analyze-match",
        { body: { match_id: matchId } }
      );
      if (error || !res?.success) {
        throw new Error(error?.message || res?.error || "Analyse échouée");
      }
      const payload = res.data;
      const predictions = (payload.predictions || []).map((p: any) => ({
        event_name: p.event_name,
        threshold: p.threshold,
        event_type: p.event_type,
        interval_text: p.interval_text,
        reasoning: p.reasoning,
        probability: typeof p.probability === "number" ? p.probability : null,
      }));
      const next: StoredAnalysis = {
        profile_code: payload.profile_code,
        profile_label: payload.profile_label,
        scenario_label: payload.scenario_label,
        scenario_text: payload.scenario_text,
        context_text: payload.context_text || contextText || "",
        confidence: payload.confidence,
        score_axe1: payload.score_axe1,
        score_axe2: payload.score_axe2,
        predictions,
      };

      saveStoredAnalysis(matchId, next);
      setStored(next);
      if (payload.context_text) setContextText(payload.context_text);
    } catch (e) {
      console.error("analyze-match invoke failed", e);
      toast.error(
        "Analyse temporairement indisponible. Réessaie dans quelques instants."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleShare = () => {
    if (!match) return;
    const text = `Pronostic SKOUP : ${match.home.name} vs ${match.away.name}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // ---------- Loading / error states ----------
  if (!validId || (!loadingFixture && (isError || !match))) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ backgroundColor: "#0F172A", color: "#E2E8F0" }}
      >
        <AlertTriangle size={36} color="#EF4444" />
        <p style={{ fontSize: 14 }}>
          Ce match est introuvable ou n'est plus disponible.
        </p>
        <button
          type="button"
          onClick={handleBack}
          style={{
            backgroundColor: "#E8622A",
            color: "#FFFFFF",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans text-[#E2E8F0]"
      style={{ backgroundColor: "#0F172A", paddingBottom: 96 }}
    >
      {/* HEADER */}
      <header
        className="relative"
        style={{
          background:
            "linear-gradient(180deg, #1E293B 0%, #162033 60%, #0F172A 100%)",
          borderBottom: "0.5px solid #1E3A5F",
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Retour"
            className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/5"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          {match && !isFinished && (
            <button
              type="button"
              onClick={handleToggleWatch}
              disabled={watchLoading}
              aria-label="Ajouter à la watchlist"
              className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/5 disabled:opacity-60"
              style={{ border: "1px solid #2D4A6B" }}
            >
              <Eye size={26} color={watched ? "#E8622A" : "#94A3B8"} />
            </button>
          )}
        </div>

        {/* Competition row */}
        {match && (
          <div className="flex items-center justify-center gap-2 px-4 pt-2">
            {match.leagueLogo && (
              <img
                src={match.leagueLogo}
                alt=""
                width={16}
                height={16}
                style={{ objectFit: "contain" }}
              />
            )}
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              {match.leagueName}
            </span>
          </div>
        )}

        {/* Teams row */}
        <div className="flex items-start justify-between px-4 pb-4 pt-2">
          <div className="flex flex-1 flex-col items-center gap-2">
            {match ? (
              <>
                <TeamLogo
                  src={match.home.logo}
                  name={match.home.name}
                  size={64}
                  rounded={8}
                />
                <span
                  className="text-center text-white"
                  style={{ fontSize: 14, fontWeight: 600 }}
                >
                  {match.home.name}
                </span>
              </>
            ) : (
              <>
                <Skeleton className="h-16 w-16 rounded-lg" />
                <Skeleton className="h-3 w-20" />
              </>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-2">
            {!match ? (
              <Skeleton className="h-10 w-24" />
            ) : isFinished ? (
              <>
                <div
                  style={{
                    backgroundColor: "#1E293B",
                    borderRadius: 20,
                    padding: "6px 16px",
                    fontSize: 11,
                    color: "#94A3B8",
                  }}
                >
                  {formatFinishedDate(match.kickoff)}
                </div>
                <div
                  className="font-display font-bold text-white"
                  style={{ fontSize: 40, marginTop: 10, lineHeight: 1 }}
                >
                  {match.goalsHome ?? 0} — {match.goalsAway ?? 0}
                </div>
                <div style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>
                  Terminé
                </div>
              </>
            ) : (
              <>
                <div
                  className="font-display font-bold text-white"
                  style={{ fontSize: 32, lineHeight: 1 }}
                >
                  {formatKickoffTime(match.kickoff)}
                </div>
                <div
                  style={{ fontSize: 14, color: "#FFFFFF", marginTop: 6 }}
                  className="text-center"
                >
                  {formatDateLabel(match.kickoff)}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            {match ? (
              <>
                <TeamLogo
                  src={match.away.logo}
                  name={match.away.name}
                  size={64}
                  rounded={8}
                />
                <span
                  className="text-center text-white"
                  style={{ fontSize: 14, fontWeight: 600 }}
                >
                  {match.away.name}
                </span>
              </>
            ) : (
              <>
                <Skeleton className="h-16 w-16 rounded-lg" />
                <Skeleton className="h-3 w-20" />
              </>
            )}
          </div>
        </div>

        {match && !isFinished && (
          <div
            className="flex flex-col items-center px-4 pb-3 pt-2"
            style={{ borderTop: "0.5px solid #1E3A5F" }}
          >
            <div
              className="mt-2 inline-flex items-center gap-2"
              style={{
                backgroundColor: "#2D1F0A",
                border: "0.5px solid #EF9F27",
                borderRadius: 8,
                padding: "5px 10px",
              }}
            >
              <AlertTriangle size={14} color="#EF9F27" />
              <span style={{ fontSize: 11, color: "#EF9F27" }}>
                Conf. de presse non disponibles
              </span>
            </div>
            <p
              className="text-center italic"
              style={{
                fontSize: 10,
                color: "#EF9F27",
                marginTop: 4,
                maxWidth: 280,
              }}
            >
              Les prédictions sont plus fiables après les conférences de presse
            </p>
          </div>
        )}
      </header>

      <main className="mx-auto flex max-w-lg flex-col">
        {/* CONTEXT */}
        <SectionLabel>
          {isFinished ? "RÉSUMÉ" : "CONTEXTE DU MATCH"}
        </SectionLabel>
        <div
          style={{
            backgroundColor: "#1E293B",
            border: "0.5px solid #1E3A5F",
            borderRadius: 12,
            margin: "0 12px",
            padding: 14,
            fontSize: 13,
            color: "#E2E8F0",
            lineHeight: 1.6,
          }}
        >
          {contextLoading && !contextText ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ) : (
            contextText || "Contexte indisponible pour ce match."
          )}
        </div>

        {/* SCENARIO (upcoming only, after analysis) */}
        {!isFinished && showAnalysis && stored && (
          <>
            <SectionLabel>SCÉNARIO ATTENDU</SectionLabel>
            <div
              style={{
                backgroundColor: "#0F2D4F",
                border: "0.5px solid #1E3A8A",
                borderRadius: 12,
                margin: "0 12px",
                padding: 14,
              }}
            >
              <span
                style={{
                  backgroundColor: "#1E3A8A",
                  color: "#FFFFFF",
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  display: "inline-block",
                }}
              >
                {stored.profile_label}
              </span>
              {stored.confidence && <ConfidenceBadge value={stored.confidence} />}

              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "#BAE0FF",
                  lineHeight: 1.6,
                }}
              >
                {stored.scenario_text}
              </p>
            </div>
          </>
        )}

        {/* ANALYZE BUTTON */}
        {match && !isFinished && !showAnalysis && (
          <div style={{ margin: "16px 12px 0" }}>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex w-full items-center justify-center gap-2 active:opacity-90 disabled:opacity-80"
              style={{
                backgroundColor: "#E8622A",
                color: "#FFFFFF",
                borderRadius: 8,
                padding: 14,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "var(--font-display, inherit)",
              }}
            >
              {analyzing ? (
                <>
                  <span
                    className="inline-block animate-spin rounded-full border-2 border-white border-t-transparent"
                    style={{ width: 16, height: 16 }}
                  />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles size={18} color="#FFFFFF" />
                  Lancer l'analyse&nbsp;
                </>
              )}
            </button>
            {analyzing && (
              <p
                className="text-center"
                style={{ fontSize: 11, color: "#475569", marginTop: 8 }}
              >
                Cela peut prendre jusqu'à 30 secondes
              </p>
            )}
          </div>
        )}

        {/* PREDICTIONS */}
        {showAnalysis && stored && (
          <>
            <SectionLabel>PRÉDICTIONS</SectionLabel>
            {stored.predictions.map((p) => (
              <UpcomingPredictionCard
                key={p.event_name}
                pred={{
                  name: p.event_name,
                  threshold: p.threshold,
                  type: p.event_type,
                  interval: p.interval_text || undefined,
                  analysis: p.reasoning,
                  probability:
                    typeof p.probability === "number" ? p.probability : undefined,
                }}
              />
            ))}
          </>
        )}
      </main>

      {/* WHATSAPP SHARE */}
      {showAnalysis && (
        <div
          className="fixed bottom-0 left-0 right-0"
          style={{
            backgroundColor: "#1E293B",
            borderTop: "0.5px solid #1E3A5F",
            padding: "12px 16px",
          }}
        >
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={handleShare}
              className="flex w-full items-center justify-center gap-2 active:opacity-80"
              style={{
                backgroundColor: "transparent",
                border: "0.5px solid #25D366",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <WhatsAppIcon />
              <span style={{ color: "#25D366", fontSize: 13 }}>
                Partager ce pronostic
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ value }: { value: string }) {
  const v = value.toUpperCase();
  const config =
    v === "HAUTE"
      ? { bg: "#0F2E1A", border: "#22C55E", color: "#22C55E", label: "Confiance haute", Icon: TrendingUp }
      : v === "BASSE"
      ? { bg: "#2D1F0A", border: "#854F0B", color: "#854F0B", label: "Confiance basse", Icon: TrendingDown }
      : { bg: "#1E293B", border: "#E8622A", color: "#E8622A", label: "Confiance moyenne", Icon: Minus };
  const { Icon } = config;
  return (
    <div
      style={{
        marginTop: 8,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        backgroundColor: config.bg,
        border: `0.5px solid ${config.border}`,
        borderRadius: 6,
        padding: "4px 10px",
      }}
    >
      <Icon size={12} color={config.color} />
      <span style={{ fontSize: 11, color: config.color, fontWeight: 500 }}>
        {config.label}
      </span>
    </div>
  );
}


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="uppercase"
      style={{
        fontSize: 10,
        color: "#475569",
        letterSpacing: "0.08em",
        margin: "16px 12px 8px",
      }}
    >
      {children}
    </h2>
  );
}

function UpcomingPredictionCard({
  pred,
}: {
  pred: {
    name: string;
    threshold: string;
    type: string;
    interval?: string;
    analysis: string;
    probability?: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const pct =
    typeof pred.probability === "number"
      ? Math.max(0, Math.min(100, Math.round(pred.probability * 100)))
      : null;
  const gaugeColor =
    pct === null ? "#475569" : pct >= 70 ? "#22C55E" : "#E8622A";
  return (
    <div
      style={{
        backgroundColor: "#1E293B",
        border: "0.5px solid #1E3A5F",
        borderRadius: 12,
        margin: "0 12px 8px",
        padding: "12px 14px",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span
          className="flex-1 text-white"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          {pred.name}
        </span>
        <span style={{ fontSize: 13, color: "#E8622A", fontWeight: 600 }}>
          {pred.threshold}
        </span>
        <ChevronDown
          size={16}
          color="#475569"
          style={{
            transition: "transform 200ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {pct !== null && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: "#0F172A",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                backgroundColor: gaugeColor,
                borderRadius: 2,
                transition: "width 300ms",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: gaugeColor,
              marginTop: 4,
              textAlign: "right",
              fontWeight: 600,
            }}
          >
            {pct}%
          </div>
        </div>
      )}
      {open && (
        <div
          style={{
            backgroundColor: "#0F172A",
            borderRadius: 8,
            padding: "10px 12px",
            marginTop: 8,
            fontSize: 12,
            color: "#94A3B8",
            lineHeight: 1.6,
          }}
        >
          {pred.analysis}
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="#25D366"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.78 11.78 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.83 11.83 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.44ZM12.05 21.4h-.01a9.85 9.85 0 0 1-5.02-1.38l-.36-.21-3.8 1 1.02-3.71-.24-.38a9.84 9.84 0 0 1-1.51-5.28c0-5.44 4.43-9.87 9.87-9.87 2.64 0 5.11 1.03 6.97 2.9a9.79 9.79 0 0 1 2.89 6.97c0 5.44-4.43 9.86-9.87 9.86Zm5.41-7.39c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.95 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.71.23 1.36.2 1.88.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}
