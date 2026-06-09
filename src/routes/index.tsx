import { useMemo, useState } from "react";
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
import { dateKey, dtoToMatch } from "@/lib/matchMapping";
import type { Competition, CompetitionGroup } from "@/data/matches";

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

const competitions: Competition[] = LEAGUES.map((l) => ({
  id: String(l.id),
  name: l.name,
  logo: l.logo,
  country: l.country,
}));

function MatchesPage() {
  const [day, setDay] = useState<DayKey>("today");
  // default: Premier League
  const [competitionId, setCompetitionId] = useState<string>("39");

  const date = useMemo(() => {
    const d = new Date();
    if (day === "tomorrow") d.setDate(d.getDate() + 1);
    return dateKey(d);
  }, [day]);

  const fetchFixtures = useServerFn(getFixtures);
  const leagueId = competitionId === "all" ? undefined : Number(competitionId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["fixtures", date, leagueId ?? "all"],
    queryFn: () => fetchFixtures({ data: { date, leagueId } }),
    enabled: !!leagueId, // require a competition selected to avoid huge global call
    staleTime: 60_000,
  });

  const groups: CompetitionGroup[] = useMemo(() => {
    if (!data?.matches?.length) return [];
    const byLeague = new Map<number, CompetitionGroup>();
    for (const dto of data.matches) {
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
    return Array.from(byLeague.values());
  }, [data]);

  return (
    <div className="min-h-screen font-sans text-[#E2E8F0]" style={{ backgroundColor: "#0F172A" }}>
      <TopBar />
      <DayToggle value={day} onChange={setDay} />
      <CompetitionSelector
        competitions={competitions}
        value={competitionId}
        onChange={setCompetitionId}
      />
      <main className="pb-24">
        {!leagueId && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "16px" }}>
            Sélectionnez une compétition pour voir les matchs.
          </p>
        )}
        {isLoading && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "16px" }}>Chargement…</p>
        )}
        {isError && (
          <p style={{ fontSize: 13, color: "#EF4444", margin: "16px" }}>
            Erreur lors du chargement des matchs.
          </p>
        )}
        {!isLoading && !isError && leagueId && groups.length === 0 && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "16px" }}>
            Aucun match {day === "today" ? "aujourd'hui" : "demain"}.
          </p>
        )}
        {groups.map((g) => (
          <CompetitionSection key={g.competition.id} group={g} />
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
