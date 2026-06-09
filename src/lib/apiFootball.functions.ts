import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_BASE = "https://v3.football.api-sports.io";

interface ApiResponse<T> {
  response: T;
  errors?: unknown;
}

async function apiFetch<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY missing");
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": key },
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const json = (await res.json()) as ApiResponse<T>;
  return json.response;
}

// ------- Public DTOs (serializable) -------
export interface DtoTeam {
  id: number;
  name: string;
  logo: string;
}
export interface DtoMatch {
  id: string;
  fixtureId: number;
  home: DtoTeam;
  away: DtoTeam;
  kickoff: string; // ISO
  venue: string;
  status: string; // short code
  elapsed: number | null;
  goalsHome: number | null;
  goalsAway: number | null;
  leagueId: number;
  leagueName: string;
  leagueLogo: string;
  country: string;
}

function mapFixture(f: any): DtoMatch {
  return {
    id: String(f.fixture.id),
    fixtureId: f.fixture.id,
    home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
    away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
    kickoff: f.fixture.date,
    venue: f.fixture.venue?.name ?? "",
    status: f.fixture.status?.short ?? "NS",
    elapsed: f.fixture.status?.elapsed ?? null,
    goalsHome: f.goals?.home ?? null,
    goalsAway: f.goals?.away ?? null,
    leagueId: f.league.id,
    leagueName: f.league.name,
    leagueLogo: f.league.logo,
    country: f.league.country,
  };
}

// ------- Fixtures by league + date -------
export const getFixtures = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        leagueId: z.number().int().positive().optional(),
        season: z.number().int().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const params: Record<string, string | number> = { date: data.date };
    if (data.leagueId) params.league = data.leagueId;
    if (data.season) params.season = data.season;
    const raw = await apiFetch<any[]>("/fixtures", params);
    const matches: DtoMatch[] = raw.map(mapFixture);
    return { matches };
  });

// ------- Team search -------
export interface DtoTeamSearch {
  id: number;
  name: string;
  logo: string;
  country: string;
}
export const searchTeams = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ q: z.string().min(2).max(50) }).parse(d),
  )
  .handler(async ({ data }) => {
    const raw = await apiFetch<any[]>("/teams", { search: data.q });
    const teams: DtoTeamSearch[] = raw.slice(0, 20).map((t) => ({
      id: t.team.id,
      name: t.team.name,
      logo: t.team.logo,
      country: t.team.country ?? "",
    }));
    return { teams };
  });

// ------- Team upcoming fixtures -------
export const getTeamNextFixtures = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ teamId: z.number().int().positive(), next: z.number().int().min(1).max(20).default(10) }).parse(d),
  )
  .handler(async ({ data }) => {
    const raw = await apiFetch<any[]>("/fixtures", { team: data.teamId, next: data.next });
    const matches: DtoMatch[] = raw.map((f) => ({
      id: String(f.fixture.id),
      fixtureId: f.fixture.id,
      home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
      away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
      kickoff: f.fixture.date,
      venue: f.fixture.venue?.name ?? "",
      status: f.fixture.status?.short ?? "NS",
      leagueId: f.league.id,
      leagueName: f.league.name,
      leagueLogo: f.league.logo,
      country: f.league.country,
    }));
    return { matches };
  });
