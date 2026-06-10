import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Eye } from "lucide-react";
import { BottomNav } from "@/components/skoup/BottomNav";
import { TeamLogo } from "@/components/skoup/TeamLogo";

export const Route = createFileRoute("/follows")({
  head: () => ({
    meta: [
      { title: "SKOUP — Suivis" },
      { name: "description", content: "Vos matchs suivis et événements en direct." },
      { property: "og:title", content: "SKOUP — Suivis" },
      { property: "og:description", content: "Vos matchs suivis et événements en direct." },
    ],
  }),
  component: FollowsPage,
});

type MatchStatus = "upcoming" | "live" | "finished";

interface FollowMatch {
  id: string;
  home: { name: string; logo: string };
  away: { name: string; logo: string };
  competition: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // ex "15h00"
  venue?: string;
  status: MatchStatus;
  scoreHome?: number;
  scoreAway?: number;
  minute?: string;
}

const DAY_NAMES_FULL = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const MONTH_NAMES_FULL = [
  "JAN",
  "FÉV",
  "MARS",
  "AVR",
  "MAI",
  "JUIN",
  "JUIL",
  "AOÛT",
  "SEPT",
  "OCT",
  "NOV",
  "DÉC",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function offsetDateKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDateLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAY_NAMES_FULL[dt.getDay()]} ${dt.getDate()} ${MONTH_NAMES_FULL[dt.getMonth()]}`;
}

const TODAY = todayKey();
const TOMORROW = offsetDateKey(1);

const initialMatches: FollowMatch[] = [
  {
    id: "m3",
    home: { name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" },
    away: { name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png" },
    competition: "Premier League",
    date: TODAY,
    time: "16h30",
    status: "live",
    scoreHome: 1,
    scoreAway: 0,
    minute: "67",
  },
  {
    id: "m1",
    home: { name: "ASEC Mimosas", logo: "https://media.api-sports.io/football/teams/3722.png" },
    away: { name: "Africa Sports", logo: "https://media.api-sports.io/football/teams/3724.png" },
    competition: "Ligue Pro CI",
    date: TODAY,
    time: "15h00",
    venue: "Stade FHB",
    status: "upcoming",
  },
  {
    id: "mfin1",
    home: { name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png" },
    away: { name: "FC Barcelone", logo: "https://media.api-sports.io/football/teams/529.png" },
    competition: "Liga",
    date: TODAY,
    time: "21h00",
    status: "finished",
    scoreHome: 2,
    scoreAway: 1,
  },
  {
    id: "m10",
    home: { name: "Sénégal", logo: "https://media.api-sports.io/football/teams/536.png" },
    away: { name: "Maroc", logo: "https://media.api-sports.io/football/teams/489.png" },
    competition: "CAN 2026",
    date: TOMORROW,
    time: "20h00",
    venue: "Stade Lat Dior",
    status: "upcoming",
  },
  {
    id: "m12",
    home: { name: "Côte d'Ivoire", logo: "https://media.api-sports.io/football/teams/537.png" },
    away: { name: "Sénégal", logo: "https://media.api-sports.io/football/teams/536.png" },
    competition: "Amical",
    date: offsetDateKey(5),
    time: "19h00",
    venue: "Stade FHB",
    status: "upcoming",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
      <span
        className="uppercase"
        style={{
          fontSize: 10,
          color: "#475569",
          letterSpacing: "0.08em",
          fontWeight: 600,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function FollowCard({
  match,
  onRemove,
}: {
  match: FollowMatch;
  onRemove: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => onRemove(match.id), 200);
  };

  const onCardClick = () => {
    navigate({ to: "/match/$matchId", params: { matchId: match.id } });
  };

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      className="cursor-pointer active:opacity-80"
      style={{
        backgroundColor: "#1E293B",
        border: "0.5px solid #1E3A5F",
        borderLeft: isLive ? "3px solid #E8622A" : "0.5px solid #1E3A5F",
        borderRadius: 12,
        margin: "4px 12px",
        padding: "10px 12px",
        opacity: leaving ? 0 : 1,
        transition: "opacity 200ms ease-out",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-[6px]">
          <div className="flex items-center gap-[10px]">
            <TeamLogo src={match.home.logo} name={match.home.name} size={28} rounded={4} />
            <span
              style={{ fontSize: 13, color: "#E2E8F0" }}
              className="flex-1 font-medium leading-tight"
            >
              {match.home.name}
            </span>
          </div>
          <div className="flex items-center gap-[10px]">
            <TeamLogo src={match.away.logo} name={match.away.name} size={28} rounded={4} />
            <span
              style={{ fontSize: 13, color: "#E2E8F0" }}
              className="flex-1 font-medium leading-tight"
            >
              {match.away.name}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            {match.competition}
            {match.venue && match.venue !== "—" ? ` · ${match.venue}` : ""}
          </span>
        </div>

        <div className="flex flex-col items-end justify-center" style={{ minWidth: 56 }}>
          {isFinished ? (
            <>
              <span
                className="font-display font-bold"
                style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}
              >
                {match.scoreHome} — {match.scoreAway}
              </span>
              <span style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Terminé</span>
            </>
          ) : isLive ? (
            <>
              <span
                className="font-display font-bold"
                style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}
              >
                {match.scoreHome} — {match.scoreAway}
              </span>
              <span style={{ fontSize: 10, color: "#22C55E", marginTop: 4 }}>
                {match.minute}'
              </span>
            </>
          ) : (
            <span
              className="font-display font-bold"
              style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}
            >
              {match.time}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Retirer de la watchlist"
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: "#0F172A",
            border: "0.5px solid #1E3A5F",
          }}
        >
          <Eye size={16} color="#E8622A" />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{ minHeight: "60vh" }}
    >
      <Bookmark size={48} color="#1E3A5F" />
      <h2 className="font-display font-bold mt-4 text-white" style={{ fontSize: 16 }}>
        Aucun match suivi
      </h2>
      <p style={{ fontSize: 13, color: "#475569", maxWidth: 260, marginTop: 6 }}>
        Appuie sur l'icône 👁 sur un match pour le suivre
      </p>
    </div>
  );
}

function FollowsPage() {
  const [matches, setMatches] = useState<FollowMatch[]>(initialMatches);

  const grouped = useMemo(() => {
    const byDate = new Map<string, FollowMatch[]>();
    for (const m of matches) {
      const arr = byDate.get(m.date) ?? [];
      arr.push(m);
      byDate.set(m.date, arr);
    }
    const sortedKeys = Array.from(byDate.keys()).sort();
    return sortedKeys.map((key) => {
      let label: string;
      if (key === TODAY) label = "AUJOURD'HUI";
      else if (key === TOMORROW) label = "DEMAIN";
      else label = formatDateLabel(key);
      return { key, label, items: byDate.get(key)! };
    });
  }, [matches]);

  const total = matches.length;
  const isEmpty = total === 0;

  const handleRemove = (id: string) =>
    setMatches((arr) => arr.filter((m) => m.id !== id));

  return (
    <div
      className="min-h-screen font-sans text-[#E2E8F0]"
      style={{ backgroundColor: "#0F172A" }}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="font-display font-bold text-white" style={{ fontSize: 18 }}>
          Suivis
        </h1>
        {!isEmpty && (
          <span
            style={{
              backgroundColor: "#1E293B",
              color: "#94A3B8",
              border: "0.5px solid #1E3A5F",
              borderRadius: 10,
              padding: "2px 10px",
              fontSize: 12,
            }}
          >
            {total} match{total > 1 ? "s" : ""}
          </span>
        )}
      </header>

      <main className="pb-24">
        {isEmpty ? (
          <EmptyState />
        ) : (
          grouped.map((section) => (
            <section key={section.key}>
              <SectionLabel>{section.label}</SectionLabel>
              {section.items.map((m) => (
                <FollowCard key={m.id} match={m} onRemove={handleRemove} />
              ))}
            </section>
          ))
        )}
      </main>

      <BottomNav active="bookmark" />
    </div>
  );
}
