import type { Match } from "./matches";

export interface TeamSearchItem {
  id: string;
  name: string;
  logo: string;
  competition: string;
  country: string;
  upcoming?: Match[];
}

export const recentSearches: TeamSearchItem[] = [
  {
    id: "asec",
    name: "ASEC Mimosas",
    logo: "https://media.api-sports.io/football/teams/3722.png",
    competition: "Ligue Pro CI",
    country: "Côte d'Ivoire",
  },
  {
    id: "arsenal",
    name: "Arsenal",
    logo: "https://media.api-sports.io/football/teams/42.png",
    competition: "Premier League",
    country: "Angleterre",
  },
  {
    id: "senegal",
    name: "Sénégal",
    logo: "https://media.api-sports.io/football/teams/536.png",
    competition: "Équipe nationale",
    country: "CAF",
  },
];

const senegalUpcoming: Match[] = [
  {
    id: "m10",
    home: { name: "Sénégal", logo: "https://media.api-sports.io/football/teams/536.png" },
    away: { name: "Maroc", logo: "https://media.api-sports.io/football/teams/489.png" },
    competition: "CAN 2026",
    competitionLogo: "https://media.api-sports.io/football/leagues/6.png",
    time: "20h00",
    venue: "Stade Lat Dior",
    window: "conf",
    inWatchlist: false,
  },
  {
    id: "m11",
    home: { name: "Sénégal", logo: "https://media.api-sports.io/football/teams/536.png" },
    away: { name: "Tunisie", logo: "https://media.api-sports.io/football/teams/519.png" },
    competition: "Éliminatoires CAN",
    competitionLogo: "https://media.api-sports.io/football/leagues/6.png",
    time: "18h00",
    venue: "Stade Léopold Sédar Senghor",
    window: "soon",
    hoursUntil: 18,
    inWatchlist: false,
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

export const teamsCatalog: TeamSearchItem[] = [
  {
    id: "senegal",
    name: "Sénégal",
    logo: "https://media.api-sports.io/football/teams/536.png",
    competition: "Équipe nationale",
    country: "CAF",
    upcoming: senegalUpcoming,
  },
  {
    id: "senec",
    name: "Senec FC",
    logo: "",
    competition: "Ligue 1 Sénégal",
    country: "Sénégal",
  },
  {
    id: "asec",
    name: "ASEC Mimosas",
    logo: "https://media.api-sports.io/football/teams/3722.png",
    competition: "Ligue Pro CI",
    country: "Côte d'Ivoire",
  },
  {
    id: "arsenal",
    name: "Arsenal",
    logo: "https://media.api-sports.io/football/teams/42.png",
    competition: "Premier League",
    country: "Angleterre",
  },
  {
    id: "real",
    name: "Real Madrid",
    logo: "https://media.api-sports.io/football/teams/541.png",
    competition: "Liga",
    country: "Espagne",
  },
  {
    id: "barca",
    name: "FC Barcelone",
    logo: "https://media.api-sports.io/football/teams/529.png",
    competition: "Liga",
    country: "Espagne",
  },
  {
    id: "maroc",
    name: "Maroc",
    logo: "https://media.api-sports.io/football/teams/489.png",
    competition: "Équipe nationale",
    country: "CAF",
  },
];

export function searchTeams(q: string): TeamSearchItem[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  return teamsCatalog
    .filter((t) => t.name.toLowerCase().includes(needle))
    .slice(0, 6);
}

export function getTeam(id: string): TeamSearchItem | undefined {
  return teamsCatalog.find((t) => t.id === id);
}
