import type { DtoMatch } from "./apiFootball.functions";
import type { Match, MatchWindow } from "@/data/matches";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

export function computeWindow(iso: string): { window: MatchWindow; hoursUntil?: number; daysUntil?: number } {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffH = (t - now) / 36e5;
  if (diffH <= 48 && diffH >= -2) return { window: "conf" };
  if (diffH < 24 * 4) return { window: "soon", hoursUntil: Math.max(1, Math.round(diffH)) };
  if (diffH < 24 * 14) return { window: "far", daysUntil: Math.round(diffH / 24) };
  return { window: null };
}

export function dtoToMatch(dto: DtoMatch): Match {
  const w = computeWindow(dto.kickoff);
  return {
    id: dto.id,
    home: { name: dto.home.name, logo: dto.home.logo },
    away: { name: dto.away.name, logo: dto.away.logo },
    time: formatTime(dto.kickoff),
    venue: dto.venue || "—",
    window: w.window,
    hoursUntil: w.hoursUntil,
    daysUntil: w.daysUntil,
    competition: dto.leagueName,
    competitionLogo: dto.leagueLogo,
    inWatchlist: false,
  };
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
