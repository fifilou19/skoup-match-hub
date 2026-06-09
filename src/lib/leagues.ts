// Curated list of leagues for SKOUP.
// IDs from API-Football (api-sports.io).
export interface LeagueDef {
  id: number; // API-Football league id
  name: string;
  country: string;
  logo: string;
  flag?: string;
  group: "europe" | "africa" | "international" | "americas" | "asia";
}

const L = (id: number, name: string, country: string, group: LeagueDef["group"]): LeagueDef => ({
  id,
  name,
  country,
  group,
  logo: `https://media.api-sports.io/football/leagues/${id}.png`,
});

export const LEAGUES: LeagueDef[] = [
  // Top Europe
  L(2, "UEFA Champions League", "Europe", "international"),
  L(3, "UEFA Europa League", "Europe", "international"),
  L(848, "UEFA Conference League", "Europe", "international"),
  L(39, "Premier League", "Angleterre", "europe"),
  L(40, "Championship", "Angleterre", "europe"),
  L(45, "FA Cup", "Angleterre", "europe"),
  L(140, "La Liga", "Espagne", "europe"),
  L(141, "La Liga 2", "Espagne", "europe"),
  L(143, "Copa del Rey", "Espagne", "europe"),
  L(135, "Serie A", "Italie", "europe"),
  L(136, "Serie B", "Italie", "europe"),
  L(137, "Coppa Italia", "Italie", "europe"),
  L(78, "Bundesliga", "Allemagne", "europe"),
  L(79, "Bundesliga 2", "Allemagne", "europe"),
  L(81, "DFB Pokal", "Allemagne", "europe"),
  L(61, "Ligue 1", "France", "europe"),
  L(62, "Ligue 2", "France", "europe"),
  L(66, "Coupe de France", "France", "europe"),
  L(88, "Eredivisie", "Pays-Bas", "europe"),
  L(94, "Primeira Liga", "Portugal", "europe"),
  L(203, "Süper Lig", "Turquie", "europe"),
  L(144, "Jupiler Pro League", "Belgique", "europe"),
  L(207, "Super League", "Suisse", "europe"),
  L(218, "Bundesliga", "Autriche", "europe"),
  L(119, "Superligaen", "Danemark", "europe"),
  L(103, "Eliteserien", "Norvège", "europe"),
  L(113, "Allsvenskan", "Suède", "europe"),
  L(106, "Ekstraklasa", "Pologne", "europe"),
  L(345, "Czech Liga", "Tchéquie", "europe"),
  L(197, "Super League 1", "Grèce", "europe"),
  L(179, "Premiership", "Écosse", "europe"),
  L(383, "Ligat Ha'Al", "Israël", "europe"),
  L(235, "Premier League", "Russie", "europe"),
  L(333, "Premier League", "Ukraine", "europe"),
  L(271, "NB I", "Hongrie", "europe"),
  L(283, "Liga I", "Roumanie", "europe"),
  L(172, "First League", "Bulgarie", "europe"),
  L(286, "Super League", "Serbie", "europe"),
  L(210, "HNL", "Croatie", "europe"),

  // Africa - clubs & national
  L(12, "CAF Champions League", "Afrique", "international"),
  L(20, "CAF Confederation Cup", "Afrique", "international"),
  L(36, "Africa Cup of Nations", "Afrique", "international"),
  L(37, "Africa Cup of Nations Qualification", "Afrique", "international"),
  L(233, "Premier League", "Égypte", "africa"),
  L(200, "Botola Pro", "Maroc", "africa"),
  L(202, "Ligue 1", "Algérie", "africa"),
  L(234, "Ligue 1", "Tunisie", "africa"),
  L(397, "Premier Soccer League", "Afrique du Sud", "africa"),
  L(360, "Ligue 1", "Sénégal", "africa"),
  L(363, "Ligue 1", "Côte d'Ivoire", "africa"),
  L(404, "Ligue 1", "Cameroun", "africa"),
  L(308, "Premier League", "Nigeria", "africa"),
  L(240, "Premier League", "Ghana", "africa"),
  L(384, "Ligue 1", "RD Congo", "africa"),

  // Americas
  L(71, "Serie A", "Brésil", "americas"),
  L(72, "Serie B", "Brésil", "americas"),
  L(128, "Liga Profesional", "Argentine", "americas"),
  L(13, "Copa Libertadores", "Amérique du Sud", "international"),
  L(11, "Copa Sudamericana", "Amérique du Sud", "international"),
  L(253, "MLS", "USA", "americas"),
  L(262, "Liga MX", "Mexique", "americas"),
  L(265, "Primera División", "Chili", "americas"),
  L(239, "Primera A", "Colombie", "americas"),

  // Asia / Oceania
  L(98, "J1 League", "Japon", "asia"),
  L(292, "K League 1", "Corée du Sud", "asia"),
  L(169, "Super League", "Chine", "asia"),
  L(307, "Saudi Pro League", "Arabie Saoudite", "asia"),
  L(17, "AFC Champions League", "Asie", "international"),

  // International - national teams & world
  L(1, "FIFA World Cup", "Monde", "international"),
  L(4, "Euro Championship", "Europe", "international"),
  L(5, "UEFA Nations League", "Europe", "international"),
  L(960, "Euro Qualification", "Europe", "international"),
  L(32, "World Cup - Qualification Europe", "Europe", "international"),
  L(34, "World Cup - Qualification Africa", "Afrique", "international"),
  L(29, "World Cup - Qualification CONMEBOL", "Amérique du Sud", "international"),
  L(15, "FIFA Club World Cup", "Monde", "international"),
  L(9, "Copa America", "Amérique du Sud", "international"),
  L(22, "CONCACAF Gold Cup", "Amérique du Nord", "international"),
  L(667, "Friendlies Clubs", "Monde", "international"),
  L(10, "Friendlies", "Monde", "international"),
];

export function getLeague(id: number): LeagueDef | undefined {
  return LEAGUES.find((l) => l.id === id);
}
