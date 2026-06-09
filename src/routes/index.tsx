import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/skoup/TopBar";
import { DayToggle, type DayKey } from "@/components/skoup/DayToggle";
import { CompetitionSelector } from "@/components/skoup/CompetitionSelector";
import { CompetitionSection } from "@/components/skoup/CompetitionSection";
import { BottomNav } from "@/components/skoup/BottomNav";
import { LEAGUES } from "@/lib/leagues";
import { getFixtures } from "@/lib/apiFootball.functions";
import { dateKey, dtoToMatch, isFinishedStatus } from "@/lib/matchMapping";
import type { CompetitionGroup } from "@/data/matches";


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

const ALLOWED_LEAGUE_IDS = new Set(LEAGUES.map((l) => l.id));

function MatchesPage() {
  const [day, setDay] = useState<DayKey>("today");
  const [competition, setCompetition] = useState<string>("all");

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
    queryKey: ["fixtures", date],
    queryFn: () => fetchFixtures({ data: { date } }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const groups: CompetitionGroup[] = useMemo(() => {
    if (!data?.matches?.length) return [];
    const byLeague = new Map<number, CompetitionGroup>();
    for (const dto of data.matches) {
      if (!ALLOWED_LEAGUE_IDS.has(dto.leagueId)) continue;
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
  }, [data]);

  const competitions = useMemo(() => groups.map((g) => g.competition), [groups]);

  const shownGroups = useMemo(() => {
    if (competition === "all") return groups;
    return groups.filter((g) => g.competition.id === competition);
  }, [groups, competition]);


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
        {!isLoading && !isError && shownGroups.length === 0 && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "16px" }}>
            Aucun match {day === "today" ? "aujourd'hui" : "demain"}.
          </p>
        )}
        {shownGroups.map((g) => (
          <CompetitionSection key={g.competition.id} group={g} />
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
