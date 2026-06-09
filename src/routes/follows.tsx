import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Eye } from "lucide-react";
import { BottomNav } from "@/components/skoup/BottomNav";
import { MatchCard } from "@/components/skoup/MatchCard";
import { TeamLogo } from "@/components/skoup/TeamLogo";
import type { Match } from "@/data/matches";

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

interface LiveMatch {
  id: string;
  home: { name: string; logo: string };
  away: { name: string; logo: string };
  competition: string;
  minute: string;
  score: { home: number; away: number };
  mainEvent: { label: string; current: number; threshold: number };
}

const initialLive: LiveMatch[] = [
  {
    id: "m3",
    home: { name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" },
    away: { name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png" },
    competition: "Premier League",
    minute: "67",
    score: { home: 1, away: 0 },
    mainEvent: { label: "Corners Arsenal › 5.5", current: 3, threshold: 6 },
  },
];

const initialToday: Match[] = [
  {
    id: "m1",
    home: { name: "ASEC Mimosas", logo: "https://media.api-sports.io/football/teams/3722.png" },
    away: { name: "Africa Sports", logo: "https://media.api-sports.io/football/teams/3724.png" },
    competition: "Ligue Pro CI",
    competitionLogo: "https://media.api-sports.io/football/leagues/99.png",
    time: "15h00",
    venue: "Stade FHB",
    window: "conf",
    inWatchlist: true,
  },
];

const initialUpcoming: Match[] = [
  {
    id: "m10",
    home: { name: "Sénégal", logo: "https://media.api-sports.io/football/teams/536.png" },
    away: { name: "Maroc", logo: "https://media.api-sports.io/football/teams/489.png" },
    competition: "CAN 2026",
    competitionLogo: "https://media.api-sports.io/football/leagues/6.png",
    time: "20h00",
    venue: "Stade Lat Dior",
    window: "soon",
    hoursUntil: 18,
    inWatchlist: true,
  },
  {
    id: "m12",
    home: { name: "Côte d'Ivoire", logo: "https://media.api-sports.io/football/teams/537.png" },
    away: { name: "Sénégal", logo: "https://media.api-sports.io/football/teams/536.png" },
    competition: "Amical",
    competitionLogo: "https://media.api-sports.io/football/leagues/667.png",
    time: "19h00",
    venue: "Stade FHB",
    window: "far",
    daysUntil: 5,
    inWatchlist: true,
  },
];

function SectionLabel({ children, live = false }: { children: React.ReactNode; live?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
      {live && (
        <span
          className="inline-block animate-pulse"
          style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: "#EF4444" }}
        />
      )}
      <span
        className="uppercase"
        style={{
          fontSize: 10,
          color: live ? "#EF4444" : "#475569",
          letterSpacing: "0.08em",
          fontWeight: 600,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function LiveCard({ match, onRemove }: { match: LiveMatch; onRemove: (id: string) => void }) {
  const navigate = useNavigate();
  const target = (match.mainEvent.current / match.mainEvent.threshold) * 100;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(t);
  }, [target]);

  return (
    <div
      style={{
        backgroundColor: "#1E293B",
        border: "0.5px solid #1E3A5F",
        borderLeft: "3px solid #E8622A",
        borderRadius: 12,
        margin: "4px 12px",
        padding: "10px 12px",
      }}
    >
      {/* Line 1 */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <TeamLogo src={match.home.logo} name={match.home.name} size={28} rounded={4} />
          <TeamLogo src={match.away.logo} name={match.away.name} size={28} rounded={4} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span style={{ fontSize: 13, color: "#FFFFFF" }} className="font-bold leading-tight">
            {match.home.name}
          </span>
          <span style={{ fontSize: 13, color: "#FFFFFF" }} className="font-bold leading-tight">
            {match.away.name}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="font-display font-bold"
            style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 1 }}
          >
            {match.score.home} — {match.score.away}
          </span>
        </div>
      </div>

      {/* Line 2 */}
      <div className="mt-2 flex items-center justify-between">
        <span style={{ fontSize: 11, color: "#22C55E" }}>⏱ {match.minute}'</span>
        <span style={{ fontSize: 11, color: "#475569" }}>{match.competition}</span>
      </div>

      {/* Gauge */}
      <div
        className="mt-2"
        style={{
          backgroundColor: "#0F172A",
          borderRadius: 4,
          height: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: "#E8622A",
            height: "100%",
            width: `${width}%`,
            transition: "width 3000ms ease-out",
          }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span style={{ fontSize: 10, color: "#475569" }}>
          {match.mainEvent.label} — {match.mainEvent.current} / {match.mainEvent.threshold}
        </span>
        <span style={{ fontSize: 10, color: "#475569" }}>
          {Math.round((match.mainEvent.current / match.mainEvent.threshold) * 100)}%
        </span>
      </div>

      {/* Bottom row: eye + voir */}
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onRemove(match.id)}
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
        <button
          type="button"
          onClick={() => navigate({ to: "/match/$matchId", params: { matchId: match.id } })}
          style={{
            backgroundColor: "transparent",
            border: "0.5px solid #1E3A5F",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            color: "#94A3B8",
          }}
        >
          Voir
        </button>
      </div>
    </div>
  );
}

function WatchableMatchCard({ match, onRemove }: { match: Match; onRemove: (id: string) => void }) {
  // Wrap MatchCard so the eye toggle also removes from the page list.
  // Since MatchCard owns its own state, we intercept the click on the eye button.
  return (
    <div
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('button[aria-label*="watchlist"]');
        if (btn) {
          setTimeout(() => onRemove(match.id), 160);
        }
      }}
    >
      <MatchCard match={match} />
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
      <h2
        className="font-display font-bold mt-4 text-white"
        style={{ fontSize: 16 }}
      >
        Aucun match suivi
      </h2>
      <p style={{ fontSize: 13, color: "#475569", maxWidth: 260, marginTop: 6 }}>
        Appuie sur l'icône 👁 sur un match pour le suivre
      </p>
    </div>
  );
}

function FollowsPage() {
  const [live, setLive] = useState<LiveMatch[]>(initialLive);
  const [today, setToday] = useState<Match[]>(initialToday);
  const [upcoming, setUpcoming] = useState<Match[]>(initialUpcoming);

  const total = useMemo(
    () => live.length + today.length + upcoming.length,
    [live, today, upcoming],
  );

  const isEmpty = total === 0;

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
          <>
            {live.length > 0 && (
              <section>
                <SectionLabel live>En direct</SectionLabel>
                {live.map((m) => (
                  <LiveCard
                    key={m.id}
                    match={m}
                    onRemove={(id) => setLive((arr) => arr.filter((x) => x.id !== id))}
                  />
                ))}
              </section>
            )}

            {today.length > 0 && (
              <section>
                <SectionLabel>Aujourd'hui</SectionLabel>
                {today.map((m) => (
                  <WatchableMatchCard
                    key={m.id}
                    match={m}
                    onRemove={(id) => setToday((arr) => arr.filter((x) => x.id !== id))}
                  />
                ))}
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <SectionLabel>À venir</SectionLabel>
                {upcoming.map((m) => (
                  <WatchableMatchCard
                    key={m.id}
                    match={m}
                    onRemove={(id) => setUpcoming((arr) => arr.filter((x) => x.id !== id))}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav active="bookmark" />
    </div>
  );
}
