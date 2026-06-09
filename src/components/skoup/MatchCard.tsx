import { useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { TeamLogo } from "./TeamLogo";
import type { Match } from "@/data/matches";

function ReliabilityBadge({ match }: { match: Match }) {
  if (match.window === "conf") {
    return (
      <span
        style={{
          backgroundColor: "#0F2E1A",
          color: "#22C55E",
          border: "0.5px solid #22C55E",
          fontSize: 9,
          borderRadius: 4,
          padding: "2px 6px",
        }}
        className="font-medium"
      >
        Conf. ✓
      </span>
    );
  }
  if (match.window === "soon" && match.hoursUntil) {
    return (
      <span
        style={{
          backgroundColor: "#1E293B",
          color: "#94A3B8",
          border: "0.5px solid #1E3A5F",
          fontSize: 9,
          borderRadius: 4,
          padding: "2px 6px",
        }}
        className="font-medium"
      >
        Dans {match.hoursUntil}h
      </span>
    );
  }
  return null;
}

export function MatchCard({ match }: { match: Match }) {
  const [inWatchlist, setInWatchlist] = useState(match.inWatchlist);
  const [pulse, setPulse] = useState(false);
  const navigate = useNavigate();

  const onCardClick = () => {
    navigate({ to: "/match/$matchId", params: { matchId: match.id } });
  };

  const onToggleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInWatchlist((v) => !v);
    setPulse(true);
    setTimeout(() => setPulse(false), 150);
  };

  return (
    <div
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      className="flex cursor-pointer items-center active:opacity-80"
      style={{
        backgroundColor: "#1E293B",
        border: "0.5px solid #1E3A5F",
        borderRadius: 12,
        margin: "4px 12px",
        padding: "10px 12px",
      }}
    >
      {/* Left: team logos */}
      <div className="flex flex-col gap-[6px]">
        <TeamLogo src={match.home.logo} name={match.home.name} size={28} rounded={4} />
        <TeamLogo src={match.away.logo} name={match.away.name} size={28} rounded={4} />
      </div>

      {/* Center: names + meta */}
      <div className="flex flex-1 flex-col pl-[10px]">
        <span style={{ fontSize: 13, color: "#E2E8F0" }} className="font-medium leading-tight">
          {match.home.name}
        </span>
        <span style={{ fontSize: 13, color: "#E2E8F0" }} className="font-medium leading-tight">
          {match.away.name}
        </span>
        <span style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
          {match.time} · {match.venue}
        </span>
      </div>

      {/* Right: badge + eye */}
      <div className="flex flex-col items-end gap-2">
        <ReliabilityBadge match={match} />
        <button
          type="button"
          onClick={onToggleWatch}
          aria-label={inWatchlist ? "Retirer de la watchlist" : "Ajouter à la watchlist"}
          className="flex items-center justify-center transition-transform duration-150"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: "#0F172A",
            border: "0.5px solid #1E3A5F",
            transform: pulse ? "scale(1.2)" : "scale(1)",
          }}
        >
          <Eye size={16} color={inWatchlist ? "#E8622A" : "#475569"} />
        </button>
      </div>
    </div>
  );
}
