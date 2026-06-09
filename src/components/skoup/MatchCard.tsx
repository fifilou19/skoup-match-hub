import { useNavigate } from "@tanstack/react-router";
import { TeamLogo } from "./TeamLogo";
import type { Match } from "@/data/matches";

export function MatchCard({ match }: { match: Match }) {
  const navigate = useNavigate();

  const onCardClick = () => {
    navigate({ to: "/match/$matchId", params: { matchId: match.id } });
  };

  return (
    <div
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      className="flex cursor-pointer active:opacity-80"
      style={{
        backgroundColor: "#1E293B",
        border: "0.5px solid #1E3A5F",
        borderRadius: 12,
        margin: "4px 12px",
        padding: "10px 12px",
      }}
    >
      <div className="flex flex-1 flex-col gap-[6px]">
        <div className="flex items-center gap-[10px]">
          <TeamLogo src={match.home.logo} name={match.home.name} size={28} rounded={4} />
          <span style={{ fontSize: 13, color: "#E2E8F0" }} className="flex-1 font-medium leading-tight">
            {match.home.name}
          </span>
        </div>
        <div className="flex items-center gap-[10px]">
          <TeamLogo src={match.away.logo} name={match.away.name} size={28} rounded={4} />
          <span style={{ fontSize: 13, color: "#E2E8F0" }} className="flex-1 font-medium leading-tight">
            {match.away.name}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
          {match.venue && match.venue !== "—" ? `${match.time} · ${match.venue}` : match.time}
        </span>
      </div>
    </div>
  );
}
