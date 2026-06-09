import { TeamLogo } from "./TeamLogo";
import { MatchCard } from "./MatchCard";
import type { CompetitionGroup } from "@/data/matches";

export function CompetitionSection({ group }: { group: CompetitionGroup }) {
  return (
    <section className="pt-3">
      <div className="flex items-center gap-2 px-4 pb-1">
        <TeamLogo src={group.competition.logo} name={group.competition.name} size={20} rounded={3} />
        <span
          style={{ fontSize: 12, color: "#94A3B8" }}
          className="font-medium"
        >
          {group.competition.name}
        </span>
      </div>
      <div>
        {group.matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  );
}
