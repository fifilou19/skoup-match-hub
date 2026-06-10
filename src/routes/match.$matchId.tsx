import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { TeamLogo } from "@/components/skoup/TeamLogo";

type Status = "upcoming" | "finished";

export const Route = createFileRoute("/match/$matchId")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: (s.status === "finished" ? "finished" : undefined) as
      | "finished"
      | undefined,
  }),
  component: MatchDetail,
});

// ---------- Mock data ----------

const upcomingMock = {
  home: {
    name: "Arsenal",
    logo: "https://media.api-sports.io/football/teams/42.png",
  },
  away: {
    name: "Chelsea",
    logo: "https://media.api-sports.io/football/teams/49.png",
  },
  kickoff: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(16, 30, 0, 0);
    return d.toISOString();
  })(),
  pressConfAvailable: false,
  context:
    "Arsenal reçoit Chelsea dans un derby londonien au sommet de la Premier League. Arsenal occupe la 2e place avec 71 points, Chelsea la 4e avec 63 points. L'enjeu est crucial pour la course au Top 4. Côté visiteur, deux absences défensives majeures fragilisent l'organisation de Chelsea.",
  scenarioProfile: "Déséquilibré / Ouvert",
  scenarioText:
    "Arsenal entre dans ce match en position de force avec une supériorité technique marquée. Chelsea adopte un bloc défensif bas face à la pression du domicile. Le pressing haut d'Arsenal devrait générer de nombreuses occasions et corners.",
  predictions: [
    {
      name: "Over 2.5 buts",
      threshold: "+ de 3 buts",
      analysis:
        "Arsenal génère 2.1 xG par match à domicile. Chelsea concède 1.4 xG en déplacement. Le scénario ouvert favorise un match prolifique des deux côtés.",
    },
    {
      name: "Corners Arsenal",
      threshold: "12 corners",
      analysis:
        "Arsenal génère en moyenne 7.2 corners à domicile face aux blocs défensifs. Chelsea concède 6.8 corners par match en déplacement. Intervalle estimé entre 12 et 16 corners pour Arsenal.",
    },
    {
      name: "BTTS",
      threshold: "Les deux marquent",
      analysis:
        "Chelsea marque dans 70% de ses matchs en déplacement. Arsenal ne garde le clean sheet qu'à 35% à domicile cette saison.",
    },
    {
      name: "Cartons",
      threshold: "+ de 4 cartons",
      analysis:
        "Derby londonien à fort enjeu. L'arbitre siffle en moyenne 4.2 cartons par rencontre. Contexte compétitif qui favorise les fautes et sanctions.",
    },
  ],
};

const finishedMock = {
  home: {
    name: "Argentine",
    logo: "https://media.api-sports.io/football/teams/26.png",
  },
  away: {
    name: "Islande",
    logo: "https://media.api-sports.io/football/teams/22.png",
  },
  kickoff: "2026-06-10T02:00:00Z",
  scoreHome: 3,
  scoreAway: 0,
  scorers: "T. Almada 86' · L. Messi 72' (Pen.) · V. Barco 8'",
  summary:
    "L'Argentine affrontait l'Islande dans le cadre de la Coupe du Monde 2026. Les Argentins se présentaient en tant que favoris et tenants du titre. L'Islande avait surpris lors de la phase de groupes mais se heurtait à la classe de l'Albiceleste. Les absences défensives islandaises avaient pesé lourd dans la rencontre.",
  predictions: [
    {
      name: "Over 2.5 buts",
      threshold: "+ de 3 buts",
      correct: true,
      actual: "3 buts marqués",
    },
    {
      name: "Corners Argentine",
      threshold: "8 corners",
      correct: true,
      actual: "11 corners",
    },
    {
      name: "BTTS",
      threshold: "Les deux marquent",
      correct: false,
      actual: "Islande n'a pas marqué",
    },
    {
      name: "Cartons",
      threshold: "+ de 3 cartons",
      correct: false,
      actual: "2 cartons au total",
    },
  ],
};

// ---------- Helpers ----------

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
    "jan",
    "fév",
    "mar",
    "avr",
    "mai",
    "juin",
    "juil",
    "août",
    "sept",
    "oct",
    "nov",
    "déc",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatFinishedDate(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- Component ----------

function MatchDetail() {
  const { matchId } = Route.useParams();
  const { status } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const isFinished = status === "finished" || matchId.startsWith("fin");
  const data = isFinished ? finishedMock : upcomingMock;

  const [watched, setWatched] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const showAnalysis = isFinished || analyzed;

  const handleBack = () => {
    if (window.history.length > 1) router.history.back();
    else navigate({ to: "/" });
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 3000);
  };

  const handleShare = () => {
    const text = `Pronostic SKOUP : ${data.home.name} vs ${data.away.name}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

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
          {!isFinished && (
            <button
              type="button"
              onClick={() => setWatched((w) => !w)}
              aria-label="Ajouter à la watchlist"
              className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/5"
            >
              <Eye size={20} color={watched ? "#E8622A" : "#94A3B8"} />
            </button>
          )}
        </div>

        {/* Teams row */}
        <div className="flex items-start justify-between px-4 pb-4 pt-2">
          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamLogo
              src={data.home.logo}
              name={data.home.name}
              size={64}
              rounded={8}
            />
            <span
              className="text-center text-white"
              style={{ fontSize: 14, fontWeight: 600 }}
            >
              {data.home.name}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-2">
            {isFinished ? (
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
                  {formatFinishedDate(data.kickoff)}
                </div>
                <div
                  className="font-display font-bold text-white"
                  style={{ fontSize: 40, marginTop: 10, lineHeight: 1 }}
                >
                  {(data as typeof finishedMock).scoreHome} —{" "}
                  {(data as typeof finishedMock).scoreAway}
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
                  {formatKickoffTime(data.kickoff)}
                </div>
                <div
                  style={{ fontSize: 14, color: "#FFFFFF", marginTop: 6 }}
                  className="text-center"
                >
                  {formatDateLabel(data.kickoff)}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamLogo
              src={data.away.logo}
              name={data.away.name}
              size={64}
              rounded={8}
            />
            <span
              className="text-center text-white"
              style={{ fontSize: 14, fontWeight: 600 }}
            >
              {data.away.name}
            </span>
          </div>
        </div>

        {isFinished && (
          <div
            className="px-4 pb-4 text-center"
            style={{ fontSize: 11, color: "#94A3B8" }}
          >
            {(data as typeof finishedMock).scorers}
          </div>
        )}

        {!isFinished && (
          <div
            className="flex flex-col items-center px-4 pb-4 pt-3"
            style={{ borderTop: "0.5px solid #1E3A5F" }}
          >
            {upcomingMock.pressConfAvailable ? (
              <div
                className="mt-3 inline-flex items-center gap-2"
                style={{
                  backgroundColor: "#0F2E1A",
                  border: "0.5px solid #22C55E",
                  borderRadius: 8,
                  padding: "6px 14px",
                }}
              >
                <CheckCircle size={14} color="#22C55E" />
                <span style={{ fontSize: 12, color: "#22C55E" }}>
                  Conférences de presse intégrées
                </span>
              </div>
            ) : (
              <>
                <div
                  className="mt-3 inline-flex items-center gap-2"
                  style={{
                    backgroundColor: "#2D1F0A",
                    border: "0.5px solid #EF9F27",
                    borderRadius: 8,
                    padding: "6px 14px",
                  }}
                >
                  <AlertTriangle size={14} color="#EF9F27" />
                  <span style={{ fontSize: 12, color: "#EF9F27" }}>
                    Conf. de presse non disponibles
                  </span>
                </div>
                <p
                  className="text-center italic"
                  style={{
                    fontSize: 10,
                    color: "#EF9F27",
                    marginTop: 6,
                    maxWidth: 280,
                  }}
                >
                  Les prédictions sont plus fiables après les conférences de
                  presse
                </p>
              </>
            )}
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
          {isFinished
            ? (data as typeof finishedMock).summary
            : upcomingMock.context}
        </div>

        {/* SCENARIO (upcoming only, after analysis) */}
        {!isFinished && showAnalysis && (
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
                {upcomingMock.scenarioProfile}
              </span>
              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "#BAE0FF",
                  lineHeight: 1.6,
                }}
              >
                {upcomingMock.scenarioText}
              </p>
            </div>
          </>
        )}

        {/* ANALYZE BUTTON */}
        {!isFinished && !showAnalysis && (
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
                  Lancer l'analyse SKOUP
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
        {showAnalysis && (
          <>
            <SectionLabel>PRÉDICTIONS</SectionLabel>
            {isFinished
              ? (data as typeof finishedMock).predictions.map((p) => (
                  <FinishedPredictionCard key={p.name} pred={p} />
                ))
              : upcomingMock.predictions.map((p) => (
                  <UpcomingPredictionCard key={p.name} pred={p} />
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
  pred: (typeof upcomingMock.predictions)[number];
}) {
  const [open, setOpen] = useState(false);
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
        <span
          style={{ fontSize: 13, color: "#E8622A", fontWeight: 600 }}
        >
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

function FinishedPredictionCard({
  pred,
}: {
  pred: (typeof finishedMock.predictions)[number];
}) {
  const ok = pred.correct;
  return (
    <div
      style={{
        backgroundColor: ok ? "#0F2E1A" : "#2D0F0F",
        border: `0.5px solid ${ok ? "#22C55E" : "#EF4444"}`,
        borderRadius: 12,
        margin: "0 12px 8px",
        padding: "12px 14px",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex-1 text-white"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          {pred.name}
        </span>
        <div className="flex flex-col items-end">
          <span
            style={{
              fontSize: 13,
              color: "#E8622A",
              fontWeight: 600,
            }}
          >
            {pred.threshold}
          </span>
          <span style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            Résultat réel : {pred.actual}
          </span>
        </div>
        {ok ? (
          <Check size={16} color="#22C55E" />
        ) : (
          <X size={16} color="#EF4444" />
        )}
      </div>
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
