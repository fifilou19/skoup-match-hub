export type MatchWindow = "conf" | "soon" | null;

export interface Team {
  name: string;
  logo: string;
}

export interface Match {
  id: string;
  home: Team;
  away: Team;
  time: string;
  venue: string;
  window: MatchWindow;
  hoursUntil?: number;
  inWatchlist: boolean;
}

export interface Competition {
  id: string;
  name: string;
  logo: string;
  country: string;
}

export interface CompetitionGroup {
  competition: Competition;
  matches: Match[];
}

export const matchesData: CompetitionGroup[] = [
  {
    competition: {
      id: "ligue-pro-ci",
      name: "Ligue Pro CI",
      logo: "https://media.api-sports.io/football/leagues/99.png",
      country: "Côte d'Ivoire",
    },
    matches: [
      {
        id: "m1",
        home: { name: "ASEC Mimosas", logo: "https://media.api-sports.io/football/teams/3722.png" },
        away: { name: "Africa Sports", logo: "https://media.api-sports.io/football/teams/3724.png" },
        time: "15h00",
        venue: "Stade FHB",
        window: "conf",
        inWatchlist: true,
      },
      {
        id: "m2",
        home: { name: "SO Armée", logo: "https://media.api-sports.io/football/teams/3726.png" },
        away: { name: "Williamsville AC", logo: "https://media.api-sports.io/football/teams/3728.png" },
        time: "17h30",
        venue: "Stade de la Paix",
        window: null,
        inWatchlist: false,
      },
    ],
  },
  {
    competition: {
      id: "premier-league",
      name: "Premier League",
      logo: "https://media.api-sports.io/football/leagues/39.png",
      country: "Angleterre",
    },
    matches: [
      {
        id: "m3",
        home: { name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" },
        away: { name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png" },
        time: "16h30",
        venue: "Emirates Stadium",
        window: "conf",
        inWatchlist: true,
      },
      {
        id: "m4",
        home: { name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png" },
        away: { name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png" },
        time: "19h00",
        venue: "Etihad Stadium",
        window: "soon",
        hoursUntil: 26,
        inWatchlist: false,
      },
    ],
  },
  {
    competition: {
      id: "liga",
      name: "Liga",
      logo: "https://media.api-sports.io/football/leagues/140.png",
      country: "Espagne",
    },
    matches: [
      {
        id: "m5",
        home: { name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png" },
        away: { name: "FC Barcelone", logo: "https://media.api-sports.io/football/teams/529.png" },
        time: "21h00",
        venue: "Santiago Bernabéu",
        window: null,
        inWatchlist: false,
      },
    ],
  },
];

export const allCompetitions: Competition[] = matchesData.map((g) => g.competition);
