// French → English (or API-known) aliases for team / country search.
// Keys must be lowercase, accent-free, trimmed.

export const TEAM_ALIASES: Record<string, string[]> = {
  // Pays / sélections nationales
  "suisse": ["Switzerland"],
  "allemagne": ["Germany"],
  "espagne": ["Spain"],
  "angleterre": ["England"],
  "ecosse": ["Scotland"],
  "pays de galles": ["Wales"],
  "irlande": ["Ireland"],
  "irlande du nord": ["Northern Ireland"],
  "italie": ["Italy"],
  "pays-bas": ["Netherlands"],
  "hollande": ["Netherlands"],
  "belgique": ["Belgium"],
  "portugal": ["Portugal"],
  "etats-unis": ["United States", "USA"],
  "etats unis": ["United States", "USA"],
  "usa": ["United States"],
  "amerique": ["United States"],
  "bresil": ["Brazil"],
  "argentine": ["Argentina"],
  "mexique": ["Mexico"],
  "canada": ["Canada"],
  "japon": ["Japan"],
  "coree du sud": ["South Korea", "Korea Republic"],
  "coree du nord": ["North Korea", "Korea DPR"],
  "chine": ["China"],
  "australie": ["Australia"],
  "nouvelle zelande": ["New Zealand"],
  "russie": ["Russia"],
  "ukraine": ["Ukraine"],
  "pologne": ["Poland"],
  "croatie": ["Croatia"],
  "serbie": ["Serbia"],
  "turquie": ["Turkey", "Türkiye"],
  "grece": ["Greece"],
  "suede": ["Sweden"],
  "norvege": ["Norway"],
  "danemark": ["Denmark"],
  "finlande": ["Finland"],
  "islande": ["Iceland"],
  "autriche": ["Austria"],
  "hongrie": ["Hungary"],
  "tcheque": ["Czech Republic", "Czechia"],
  "republique tcheque": ["Czech Republic", "Czechia"],
  "slovaquie": ["Slovakia"],
  "roumanie": ["Romania"],
  "bulgarie": ["Bulgaria"],
  "maroc": ["Morocco"],
  "algerie": ["Algeria"],
  "tunisie": ["Tunisia"],
  "egypte": ["Egypt"],
  "senegal": ["Senegal"],
  "cote d'ivoire": ["Ivory Coast", "Cote d'Ivoire"],
  "cote divoire": ["Ivory Coast", "Cote d'Ivoire"],
  "afrique du sud": ["South Africa"],
  "nigeria": ["Nigeria"],
  "ghana": ["Ghana"],
  "cameroun": ["Cameroon"],
  "mali": ["Mali"],
  "burkina": ["Burkina Faso"],
  "guinee": ["Guinea"],
  "gabon": ["Gabon"],
  "congo": ["Congo"],
  "rd congo": ["DR Congo", "Congo DR"],
  "republique democratique du congo": ["DR Congo"],

  // Clubs francisés
  "bayern munich": ["Bayern München", "Bayern Munich"],
  "munich": ["Bayern München"],
  "milan ac": ["AC Milan"],
  "inter milan": ["Inter"],
  "juventus turin": ["Juventus"],
  "fc barcelone": ["Barcelona"],
  "barcelone": ["Barcelona"],
  "real madrid": ["Real Madrid"],
  "atletico madrid": ["Atletico Madrid"],
  "manchester united": ["Manchester United"],
  "manchester city": ["Manchester City"],
  "liverpool fc": ["Liverpool"],
  "chelsea fc": ["Chelsea"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Damerau-Levenshtein distance (small inputs).
function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

/**
 * Build candidate query strings for the API from a user query, handling:
 *  - accent / case insensitive lookup
 *  - French → English aliases
 *  - typo tolerance (fuzzy match against alias keys)
 */
export function buildSearchCandidates(rawQuery: string): string[] {
  const q = normalize(rawQuery);
  const candidates = new Set<string>();
  // Always try the original query (API may know the French spelling).
  candidates.add(rawQuery.trim());

  // Exact alias hit.
  if (TEAM_ALIASES[q]) {
    for (const v of TEAM_ALIASES[q]) candidates.add(v);
  }

  // Fuzzy alias match for typos. Only consider close-length keys.
  if (q.length >= 4) {
    const maxDist = q.length <= 5 ? 1 : 2;
    let best: { key: string; d: number } | null = null;
    for (const key of Object.keys(TEAM_ALIASES)) {
      if (Math.abs(key.length - q.length) > maxDist) continue;
      const d = distance(q, key);
      if (d <= maxDist && (!best || d < best.d)) best = { key, d };
    }
    if (best) {
      for (const v of TEAM_ALIASES[best.key]) candidates.add(v);
    }
  }

  // Cap to avoid bombarding the API.
  return Array.from(candidates).slice(0, 4);
}
