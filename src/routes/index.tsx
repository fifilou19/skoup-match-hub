import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/skoup/TopBar";
import { DayToggle, type DayKey } from "@/components/skoup/DayToggle";
import { CompetitionSelector } from "@/components/skoup/CompetitionSelector";
import { CompetitionSection } from "@/components/skoup/CompetitionSection";
import { BottomNav } from "@/components/skoup/BottomNav";
import { matchesData, allCompetitions } from "@/data/matches";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SKOUP — Matchs" },
      { name: "description", content: "Suivez les matchs du jour et de demain sur SKOUP." },
      { property: "og:title", content: "SKOUP — Matchs" },
      {
        property: "og:description",
        content: "Suivez les matchs du jour et de demain sur SKOUP.",
      },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const [day, setDay] = useState<DayKey>("today");
  const [competitionId, setCompetitionId] = useState<string>("all");

  const filtered = useMemo(
    () =>
      competitionId === "all"
        ? matchesData
        : matchesData.filter((g) => g.competition.id === competitionId),
    [competitionId],
  );

  return (
    <div
      className="min-h-screen font-sans text-[#E2E8F0]"
      style={{ backgroundColor: "#0F172A" }}
    >
      <TopBar />
      <DayToggle value={day} onChange={setDay} />
      <CompetitionSelector
        competitions={allCompetitions}
        value={competitionId}
        onChange={setCompetitionId}
      />
      <main className="pb-24">
        {filtered.map((g) => (
          <CompetitionSection key={g.competition.id} group={g} />
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
