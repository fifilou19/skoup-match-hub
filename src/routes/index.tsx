import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/skoup/TopBar";
import { DayToggle, type DayKey } from "@/components/skoup/DayToggle";
import { CompetitionSelector } from "@/components/skoup/CompetitionSelector";
import { CompetitionSection } from "@/components/skoup/CompetitionSection";
import { BottomNav } from "@/components/skoup/BottomNav";
import { TeamLogo } from "@/components/skoup/TeamLogo";
import { getFixtures } from "@/lib/apiFootball.functions";
import {
  dateKey,
  dtoToMatch,
  formatTime,
  isFinishedStatus,
  isLiveStatus,
} from "@/lib/matchMapping";
import type { CompetitionGroup } from "@/data/matches";
import type { DtoMatch } from "@/lib/apiFootball.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SKOUP — Matchs" },
      { name: "description", content: "Suivez les matchs du jour et de demain sur SKOUP." },
      { property: "og:title", content: "SKOUP — Matchs" },
      { property: "og:description", content: "Suivez les matchs du jour et de demain sur SKOUP." },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const [day, setDay] = useState<DayKey>("today");
  const [competition, setCompetition] = useState<string>("all");

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const date = useMemo(() => {
    const d = new Date();
    if (day === "tomorrow") d.setDate(d.getDate() + 1);
    return dateKey(d);
  }, [day]);

  useEffect(() => {
    setCompetition("all");
  }, [day]);

  const fetchFixtures = useServerFn(getFixtures);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["fixtures", date, timezone],
    queryFn: () => fetchFixtures({ data: { date, timezone } }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // All matches sorted by kickoff asc
  const allMatches: DtoMatch[] = useMemo(() => {
    if (!data?.matches?.length) return [];
    return [...data.matches].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    );
  }, [data]);

  // Build the competition list (all matches of the day, all statuses)
  const competitions = useMemo(() => {
    const seen = new Map<number, { id: string; name: string; logo: string; country: string }>();
    for (const m of allMatches) {
      if (!seen.has(m.leagueId)) {
        seen.set(m.leagueId, {
          id: String(m.leagueId),
          name: m.leagueName,
          logo: m.leagueLogo,
          country: m.country,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allMatches]);

  // Apply competition filter
  const filteredMatches = useMemo(() => {
    if (competition === "all") return allMatches;
    return allMatches.filter((m) => String(m.leagueId) === competition);
  }, [allMatches, competition]);

  // Today: split into live / upcoming / finished
  const liveMatches = useMemo(
    () => filteredMatches.filter((m) => isLiveStatus(m.status)),
    [filteredMatches],
  );
  const upcomingMatches = useMemo(
    () =>
      filteredMatches.filter(
        (m) => !isLiveStatus(m.status) && !isFinishedStatus(m.status),
      ),
    [filteredMatches],
  );
  const finishedMatches = useMemo(
    () => filteredMatches.filter((m) => isFinishedStatus(m.status)),
    [filteredMatches],
  );

  // Tomorrow: keep existing competition-grouped layout, NS only
  const tomorrowGroups: CompetitionGroup[] = useMemo(() => {
    if (day !== "tomorrow") return [];
    const byLeague = new Map<number, CompetitionGroup>();
    for (const dto of filteredMatches) {
      if (isLiveStatus(dto.status) || isFinishedStatus(dto.status)) continue;
      const key = dto.leagueId;
      if (!byLeague.has(key)) {
        byLeague.set(key, {
          competition: {
            id: String(dto.leagueId),
            name: dto.leagueName,
            logo: dto.leagueLogo,
            country: dto.country,
          },
          matches: [],
        });
      }
      byLeague.get(key)!.matches.push(dtoToMatch(dto));
    }
    return Array.from(byLeague.values()).sort((a, b) =>
      a.competition.name.localeCompare(b.competition.name),
    );
  }, [filteredMatches, day]);

  const totalShown =
    day === "today"
      ? liveMatches.length + upcomingMatches.length + finishedMatches.length
      : tomorrowGroups.reduce((sum, g) => sum + g.matches.length, 0);

  return (
    <div className="min-h-screen font-sans text-[#E2E8F0]" style={{ backgroundColor: "#0F172A" }}>
      <TopBar />
      <DayToggle value={day} onChange={setDay} />
      <CompetitionSelector
        competitions={competitions}
        value={competition}
        onChange={setCompetition}
      />
      <main className="pb-24">
        {isLoading && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "16px" }}>Chargement…</p>
        )}
        {isError && (
          <p style={{ fontSize: 13, color: "#EF4444", margin: "16px" }}>
            Erreur lors du chargement des matchs.
          </p>
        )}
        {!isLoading && !isError && totalShown === 0 && (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ minHeight: "calc(100vh - 280px)" }}
          >
            <span style={{ fontSize: 48, lineHeight: 1 }}>⚽</span>
            <h2
              className="font-bold mt-4"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              Aucun match à venir
            </h2>
            <p
              className="mt-2 px-6"
              style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5 }}
            >
              {day === "today"
                ? "Les matchs du jour commencent bientôt. Consulte l'onglet Demain pour voir ce qui arrive."
                : "Pas de match prévu pour demain. Reviens plus tard."}
            </p>
            {day === "today" && (
              <button
                type="button"
                onClick={() => setDay("tomorrow")}
                className="mt-5 font-medium cursor-pointer"
                style={{
                  backgroundColor: "#E8622A",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 13,
                  border: "none",
                }}
              >
                Voir les matchs de demain
              </button>
            )}
          </div>
        )}

        {day === "today" && (
          <>
            {liveMatches.length > 0 && (
              <section className="pt-3">
                <LiveSectionHeader />
                {liveMatches.map((m) => (
                  <StatusMatchCard key={m.id} dto={m} variant="live" />
                ))}
              </section>
            )}
            {upcomingMatches.length > 0 && (
              <section className="pt-3">
                <SectionHeader label="À VENIR" color="#94A3B8" />
                {upcomingMatches.map((m) => (
                  <StatusMatchCard key={m.id} dto={m} variant="upcoming" />
                ))}
              </section>
            )}
            {finishedMatches.length > 0 && (
              <section className="pt-3">
                <SectionHeader label="TERMINÉS" color="#475569" />
                {finishedMatches.map((m) => (
                  <StatusMatchCard key={m.id} dto={m} variant="finished" />
                ))}
              </section>
            )}
          </>
        )}

        {day === "tomorrow" &&
          tomorrowGroups.map((g) => (
            <CompetitionSection key={g.competition.id} group={g} />
          ))}
      </main>
      <BottomNav />
    </div>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <h2
      className="uppercase font-medium"
      style={{
        fontSize: 11,
        color,
        letterSpacing: "0.08em",
        padding: "0 16px 6px",
      }}
    >
      {label}
    </h2>
  );
}

function LiveSectionHeader() {
  return (
    <div className="flex items-center gap-2" style={{ padding: "0 16px 6px" }}>
      <span
        className="inline-block animate-pulse"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: "#EF4444",
        }}
      />
      <h2
        className="uppercase font-medium"
        style={{
          fontSize: 11,
          color: "#EF4444",
          letterSpacing: "0.08em",
        }}
      >
        EN DIRECT
      </h2>
    </div>
  );
}

function StatusMatchCard({
  dto,
  variant,
}: {
  dto: DtoMatch;
  variant: "live" | "upcoming" | "finished";
}) {
  const navigate = useNavigate();
  const onClick = () => {
    navigate({ to: "/match/$matchId", params: { matchId: dto.id } });
  };

  const isLive = variant === "live";
  const isFinished = variant === "finished";

  return (
    <div
      onClick={onClick}
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
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-[6px]">
          <div className="flex items-center gap-[10px]">
            <TeamLogo src={dto.home.logo} name={dto.home.name} size={28} rounded={4} />
            <span
              style={{ fontSize: 13, color: "#E2E8F0" }}
              className="flex-1 font-medium leading-tight"
            >
              {dto.home.name}
            </span>
          </div>
          <div className="flex items-center gap-[10px]">
            <TeamLogo src={dto.away.logo} name={dto.away.name} size={28} rounded={4} />
            <span
              style={{ fontSize: 13, color: "#E2E8F0" }}
              className="flex-1 font-medium leading-tight"
            >
              {dto.away.name}
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
            {dto.leagueLogo && (
              <img
                src={dto.leagueLogo}
                alt=""
                width={14}
                height={14}
                style={{ objectFit: "contain" }}
              />
            )}
            <span style={{ fontSize: 11, color: "#475569" }}>{dto.leagueName}</span>
          </div>
        </div>

        <div
          className="flex flex-col items-center justify-center"
          style={{ minWidth: 64 }}
        >
          {isLive ? (
            <>
              <span
                className="font-display font-bold"
                style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 1 }}
              >
                {dto.goalsHome ?? 0} — {dto.goalsAway ?? 0}
              </span>
              <span
                className="animate-pulse"
                style={{ fontSize: 11, color: "#22C55E", marginTop: 4, fontWeight: 600 }}
              >
                {dto.elapsed ? `${dto.elapsed}'` : dto.status}
              </span>
            </>
          ) : isFinished ? (
            <>
              <span
                className="font-display font-bold"
                style={{ fontSize: 18, color: "#94A3B8", lineHeight: 1 }}
              >
                {dto.goalsHome ?? 0} — {dto.goalsAway ?? 0}
              </span>
              <span style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
                Terminé
              </span>
            </>
          ) : (
            <span
              className="font-display font-bold"
              style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}
            >
              {formatTime(dto.kickoff)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
