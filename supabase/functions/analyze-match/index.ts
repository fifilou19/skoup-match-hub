// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const GENERIC_ERROR = 'Analysis temporarily unavailable. Please try again.'
const UNAUTHORIZED_ERROR = 'Unauthorized. Please sign in to analyze matches.'
const QUOTA_ERROR = 'Daily analysis quota exceeded. Please try again tomorrow.'

// Appel OpenRouter
async function callLLM(prompt: string, systemPrompt: string) {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skoup.app',
        'X-Title': 'SKOUP'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    }
  )
  const data = await response.json()
  return data.choices[0].message.content
}

// Calcul Score Axe 1 — Rapport de force
function calcAxe1(stats: any): number {
  let score = 0

  const deltaXG = Math.abs(
    (stats.home.xg_avg || 0) - (stats.away.xg_avg || 0)
  )
  if (deltaXG > 1.5) score += 3
  else if (deltaXG > 1.0) score += 2
  else if (deltaXG > 0.5) score += 1

  const deltaRank = Math.abs(
    (stats.home.points_pct || 0) - (stats.away.points_pct || 0)
  )
  if (deltaRank > 30) score += 2
  else if (deltaRank > 15) score += 1

  const absences = stats.away.key_absences || 0
  if (absences >= 2) score += 2
  else if (absences === 1) score += 1

  const h2hWins = stats.h2h_wins || 0
  if (h2hWins >= 4) score += 2
  else if (h2hWins >= 3) score += 1

  if ((stats.home.home_win_pct || 0) > 60) score += 1

  return Math.min(10, score)
}

// Calcul de l'enjeu (Axe 2) basé sur les standings
function calcEnjeu(homeStanding: any, awayStanding: any, totalTeams: number): number {
  if (!homeStanding || !awayStanding) return 0

  const homeRank = homeStanding.rank || 10
  const awayRank = awayStanding.rank || 10

  const relegationZone = totalTeams - 2
  const homeInDanger = homeRank >= relegationZone
  const awayInDanger = awayRank >= relegationZone

  const homeInTitle = homeRank <= 2
  const awayInTitle = awayRank <= 2
  const homeInEurope = homeRank <= 4
  const awayInEurope = awayRank <= 4

  if ((homeInDanger || awayInDanger) && (homeInTitle || awayInTitle)) return -2
  if (homeInDanger || awayInDanger) return -2
  if (homeInTitle && awayInTitle) return -2
  if (homeInEurope && awayInEurope) return -1

  return 0
}

// Calcul Score Axe 2 — Intensité
function calcAxe2(stats: any, enjeu: number, confSignal: number): number {
  let score = 0

  const ppda = (
    (stats.home.ppda || 12) + (stats.away.ppda || 12)
  ) / 2
  if (ppda < 8) score += 3
  else if (ppda < 11) score += 2
  else if (ppda < 14) score += 1

  const xgTotal =
    (stats.home.xg_avg || 0) + (stats.away.xg_avg || 0)
  if (xgTotal > 3.0) score += 2
  else if (xgTotal > 2.0) score += 1

  const cornersTotal =
    (stats.home.corners_avg || 0) + (stats.away.corners_avg || 0)
  if (cornersTotal > 11) score += 2
  else if (cornersTotal > 8) score += 1

  score += enjeu
  score += confSignal

  return Math.max(0, Math.min(10, score))
}

function getProfile(axe1: number, axe2: number): string {
  if (axe1 >= 5 && axe2 >= 5) return 'P3'
  if (axe1 < 5 && axe2 >= 5) return 'P1'
  if (axe1 < 5 && axe2 < 5) return 'P2'
  return 'P4'
}

function getEventsForProfile(profile: string): string[] {
  const events: Record<string, string[]> = {
    P1: ['total_buts_over', 'btts', 'corners_total', 'tentatives'],
    P2: ['total_buts_under', 'cartons', 'fautes', 'nul'],
    P3: ['victoire_favori', 'total_buts_over', 'corners_favori', 'tentatives_favori'],
    P4: ['victoire_favori', 'total_buts_under', 'corners_favori', 'cartons_outsider'],
    P5: ['cartons', 'buts_mt1', 'buts_mt2', 'victoire_motive']
  }
  return events[profile] || events['P1']
}

function poissonProb(lambda: number, k: number): number {
  let prob = Math.exp(-lambda)
  for (let i = 1; i <= k; i++) prob *= lambda / i
  return prob
}

function poissonOver(lambda: number, threshold: number): number {
  let cumul = 0
  for (let k = 0; k <= threshold; k++) {
    cumul += poissonProb(lambda, k)
  }
  return Math.max(0, Math.min(1, 1 - cumul))
}

function calcPredictions(
  eventCodes: string[],
  stats: any,
  coeffArbitre: number,
  coeffEnjeu: number
) {
  const predictions: any[] = []

  for (const code of eventCodes) {
    let prediction: any = null

    if (code === 'total_buts_over') {
      const lambda =
        (stats.home.goals_avg || 1.3) +
        (stats.away.goals_avg || 1.0)
      const prob = poissonOver(lambda, 2)
      if (prob >= 0.55) {
        prediction = {
          event_code: code,
          event_name: 'Total buts',
          threshold: '+ 2.5 buts',
          event_type: 'binaire',
          probability: prob,
          reasoning: `Lambda calculé : ${lambda.toFixed(2)} buts attendus. Probabilité Over 2.5 : ${(prob * 100).toFixed(0)}%.`
        }
      }
    }

    if (code === 'total_buts_under') {
      const lambda =
        (stats.home.goals_avg || 1.3) +
        (stats.away.goals_avg || 1.0)
      const prob = 1 - poissonOver(lambda, 2)
      if (prob >= 0.55) {
        prediction = {
          event_code: code,
          event_name: 'Total buts',
          threshold: '- 2.5 buts',
          event_type: 'binaire',
          probability: prob,
          reasoning: `Lambda calculé : ${lambda.toFixed(2)} buts attendus. Probabilité Under 2.5 : ${(prob * 100).toFixed(0)}%.`
        }
      }
    }

    if (code === 'btts') {
      const probA = 1 - poissonProb(stats.home.goals_avg || 1.3, 0)
      const probB = 1 - poissonProb(stats.away.goals_avg || 1.0, 0)
      const prob = probA * probB
      if (prob >= 0.55) {
        prediction = {
          event_code: code,
          event_name: 'Les deux équipes marquent',
          threshold: 'Oui',
          event_type: 'binaire',
          probability: prob,
          reasoning: `Probabilité domicile marque : ${(probA * 100).toFixed(0)}%. Probabilité extérieur marque : ${(probB * 100).toFixed(0)}%.`
        }
      }
    }

    if (code === 'corners_total' || code === 'corners_favori') {
      const lambdaCorners =
        (stats.home.corners_avg || 5) +
        (stats.away.corners_avg || 4.5)
      const threshold = Math.floor(lambdaCorners) - 1
      const prob = poissonOver(lambdaCorners, threshold)
      if (prob >= 0.55) {
        prediction = {
          event_code: code,
          event_name: 'Corners',
          threshold: `+ ${threshold}.5 corners`,
          event_type: 'intervalle',
          interval_text: `Entre ${threshold + 1} et ${threshold + 4} corners estimés`,
          probability: prob,
          reasoning: `Moyenne corners : ${lambdaCorners.toFixed(1)} par match. Seuil conservateur à ${threshold}.5.`
        }
      }
    }

    if (code === 'cartons' || code === 'cartons_outsider') {
      const lambdaCartons =
        ((stats.home.cards_avg || 2) +
          (stats.away.cards_avg || 2)) *
        coeffArbitre * coeffEnjeu
      const threshold = Math.floor(lambdaCartons) - 1
      const prob = poissonOver(lambdaCartons, threshold)
      if (prob >= 0.55) {
        prediction = {
          event_code: code,
          event_name: 'Cartons',
          threshold: `+ ${threshold}.5 cartons`,
          event_type: 'intervalle',
          interval_text: `Entre ${threshold} et ${threshold + 3} cartons estimés`,
          probability: prob,
          reasoning: `Lambda cartons ajusté : ${lambdaCartons.toFixed(1)} (coeff arbitre: ${coeffArbitre.toFixed(2)}, coeff enjeu: ${coeffEnjeu.toFixed(2)}).`
        }
      }
    }

    if (code === 'victoire_favori') {
      const lambdaHome = stats.home.goals_avg || 1.3
      const lambdaAway = stats.away.goals_avg || 1.0

      let probHome = 0
      for (let i = 1; i <= 6; i++) {
        for (let j = 0; j < i; j++) {
          probHome += poissonProb(lambdaHome, i) * poissonProb(lambdaAway, j)
        }
      }
      probHome = Math.min(0.85, probHome)

      const homeIsFavori = lambdaHome >= lambdaAway
      const prob = homeIsFavori ? probHome : (1 - probHome - 0.25)
      const teamName = homeIsFavori ? stats.home.name : stats.away.name
      const market = homeIsFavori ? '1' : '2'

      if (prob >= 0.50) {
        prediction = {
          event_code: code,
          event_name: `Victoire ${teamName}`,
          threshold: market,
          event_type: 'binaire',
          probability: prob,
          reasoning: `${teamName} est favori avec ${(prob * 100).toFixed(0)}% de probabilité de victoire selon les moyennes de buts.`
        }
      }
    }

    if (code === 'nul') {
      const lambdaHome = stats.home.goals_avg || 1.3
      const lambdaAway = stats.away.goals_avg || 1.0

      let probDraw = 0
      for (let k = 0; k <= 5; k++) {
        probDraw += poissonProb(lambdaHome, k) * poissonProb(lambdaAway, k)
      }

      if (probDraw >= 0.22) {
        prediction = {
          event_code: code,
          event_name: 'Match nul',
          threshold: 'X',
          event_type: 'binaire',
          probability: probDraw,
          reasoning: `Probabilité de match nul calculée à ${(probDraw * 100).toFixed(0)}%. Les deux équipes ont des moyennes offensives proches.`
        }
      }
    }

    if (code === 'buts_mt1') {
      const lambdaTotal = (stats.home.goals_avg || 1.3) + (stats.away.goals_avg || 1.0)
      const lambdaMT1 = lambdaTotal * 0.45
      const prob = 1 - poissonProb(lambdaMT1, 0)

      if (prob >= 0.55) {
        prediction = {
          event_code: code,
          event_name: 'Buts 1ère mi-temps',
          threshold: '+ 0.5 buts',
          event_type: 'binaire',
          probability: prob,
          reasoning: `Lambda 1ère MT estimé à ${lambdaMT1.toFixed(2)}. Probabilité d'au moins 1 but avant la mi-temps : ${(prob * 100).toFixed(0)}%.`
        }
      }
    }

    if (code === 'buts_mt2') {
      const lambdaTotal = (stats.home.goals_avg || 1.3) + (stats.away.goals_avg || 1.0)
      const lambdaMT2 = lambdaTotal * 0.55
      const prob = 1 - poissonProb(lambdaMT2, 0)

      if (prob >= 0.55) {
        prediction = {
          event_code: code,
          event_name: 'Buts 2ème mi-temps',
          threshold: '+ 0.5 buts',
          event_type: 'binaire',
          probability: prob,
          reasoning: `Lambda 2ème MT estimé à ${lambdaMT2.toFixed(2)}. La 2ème période est historiquement plus productive.`
        }
      }
    }

    if (code === 'victoire_motive') {
      const prob = 0.62
      prediction = {
        event_code: code,
        event_name: 'Victoire équipe motivée',
        threshold: 'Double chance',
        event_type: 'binaire',
        probability: prob,
        reasoning: "L'équipe avec un enjeu fort surperforme statistiquement ses moyennes habituelles dans ce type de contexte."
      }
    }

    if (prediction) predictions.push(prediction)
  }

  return predictions.sort((a, b) => b.probability - a.probability)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authentication — verify Supabase JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: UNAUTHORIZED_ERROR }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: UNAUTHORIZED_ERROR }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const userId = user.id

    // 2. Input validation — match_id must be a positive integer
    const body = await req.json()
    const rawMatchId = body.match_id
    if (!rawMatchId) {
      return new Response(
        JSON.stringify({ error: 'match_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const numericId = parseInt(rawMatchId, 10)
    if (!Number.isFinite(numericId) || numericId <= 0 || numericId.toString() !== rawMatchId.toString().trim()) {
      return new Response(
        JSON.stringify({ error: 'Invalid match_id. Must be a positive integer.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const match_id = numericId.toString()

    // 3. Daily quota check
    const today = new Date().toISOString().split('T')[0]
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: quotaRow } = await supabaseAdmin
      .from('daily_quota')
      .select('count')
      .eq('user_id', userId)
      .eq('quota_date', today)
      .maybeSingle()

    const currentCount = quotaRow?.count || 0
    const DAILY_LIMIT = 10
    if (currentCount >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: QUOTA_ERROR }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Cache : analyse existante
    const { data: existing } = await supabaseAdmin
      .from('analyses')
      .select('*, predictions(*)')
      .eq('match_id', match_id)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, cached: true, data: existing }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Récupérer le match
    const apiKey = Deno.env.get('API_FOOTBALL_KEY')
    const fixtureRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${match_id}`,
      { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
    )
    const fixtureData = await fixtureRes.json()
    const fixture = fixtureData.response?.[0]

    if (!fixture) {
      return new Response(
        JSON.stringify({ error: 'Match introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const season = fixture.league.season
    const leagueId = fixture.league.id
    const homeId = fixture.teams.home.id
    const awayId = fixture.teams.away.id

    const [homeStatsRes, awayStatsRes, h2hRes, homeRecentRes, awayRecentRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/teams/statistics?season=${season}&team=${homeId}&league=${leagueId}`,
        { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'v3.football.api-sports.io' } }),
      fetch(`https://v3.football.api-sports.io/teams/statistics?season=${season}&team=${awayId}&league=${leagueId}`,
        { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'v3.football.api-sports.io' } }),
      fetch(`https://v3.football.api-sports.io/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`,
        { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'v3.football.api-sports.io' } }),
      fetch(`https://v3.football.api-sports.io/fixtures?team=${homeId}&last=10&season=${season}`,
        { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'v3.football.api-sports.io' } }),
      fetch(`https://v3.football.api-sports.io/fixtures?team=${awayId}&last=10&season=${season}`,
        { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'v3.football.api-sports.io' } }),
    ])

    const homeStats = await homeStatsRes.json()
    const awayStats = await awayStatsRes.json()
    const h2hData = await h2hRes.json()
    const homeRecent = await homeRecentRes.json()
    const awayRecent = await awayRecentRes.json()

    const homeS = homeStats.response || {}
    const awayS = awayStats.response || {}

    // Fetch corner stats per recent fixture in parallel
    async function avgCorners(fixtures: any[], teamId: number, fallback: number): Promise<number> {
      const ids = (fixtures || []).slice(0, 10).map((f: any) => f.fixture?.id).filter(Boolean)
      if (ids.length === 0) return fallback
      const results = await Promise.all(ids.map((id: number) =>
        fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${id}&team=${teamId}`,
          { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'v3.football.api-sports.io' } })
          .then(r => r.json()).catch(() => null)
      ))
      const values: number[] = []
      for (const r of results) {
        const stat = r?.response?.[0]?.statistics?.find((s: any) => s.type === 'Corner Kicks')
        const v = typeof stat?.value === 'number' ? stat.value : parseInt(stat?.value, 10)
        if (Number.isFinite(v)) values.push(v)
      }
      if (values.length === 0) return fallback
      return values.reduce((a, b) => a + b, 0) / values.length
    }

    const [homeCornersAvg, awayCornersAvg] = await Promise.all([
      avgCorners(homeRecent.response, homeId, 5.5),
      avgCorners(awayRecent.response, awayId, 4.5),
    ])

    const stats = {
      home: {
        name: fixture.teams.home.name,
        goals_avg: parseFloat(homeS.goals?.for?.average?.total || '1.3'),
        xg_avg: parseFloat(homeS.goals?.for?.average?.total || '1.3'),
        corners_avg: homeCornersAvg,
        cards_avg: (homeS.cards?.yellow?.total || 40) /
          Math.max(homeS.fixtures?.played?.home || 10, 1),
        ppda: 11,
        points_pct: (homeS.fixtures?.wins?.home || 0) /
          Math.max(homeS.fixtures?.played?.home || 10, 1) * 100,
        home_win_pct: (homeS.fixtures?.wins?.home || 0) /
          Math.max(homeS.fixtures?.played?.home || 10, 1) * 100,
        key_absences: 0
      },
      away: {
        name: fixture.teams.away.name,
        goals_avg: parseFloat(awayS.goals?.for?.average?.total || '1.0'),
        xg_avg: parseFloat(awayS.goals?.for?.average?.total || '1.0'),
        corners_avg: awayCornersAvg,
        cards_avg: (awayS.cards?.yellow?.total || 38) /
          Math.max(awayS.fixtures?.played?.away || 10, 1),
        ppda: 12,
        points_pct: (awayS.fixtures?.wins?.away || 0) /
          Math.max(awayS.fixtures?.played?.away || 10, 1) * 100,
        key_absences: 0
      },

      h2h_wins: h2hData.response?.filter(
        (m: any) => m.teams.home.winner === true &&
          m.teams.home.id === homeId
      ).length || 0
    }

    // Standings pour calcul d'enjeu
    const standingsRes = await fetch(
      `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`,
      { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'v3.football.api-sports.io' } }
    )
    const standingsData = await standingsRes.json()
    const standings = standingsData.response?.[0]?.league?.standings?.[0] || []
    const totalTeams = standings.length || 20
    const homeStanding = standings.find((s: any) => s.team.id === homeId)
    const awayStanding = standings.find((s: any) => s.team.id === awayId)
    const enjeu = calcEnjeu(homeStanding, awayStanding, totalTeams)

    const scoreAxe1 = calcAxe1(stats)
    const scoreAxe2 = calcAxe2(stats, enjeu, 0)
    const profile = getProfile(scoreAxe1, scoreAxe2)

    const coeffArbitre = 1.0
    const coeffEnjeu = 1.0

    const eventCodes = getEventsForProfile(profile)
    const predictions = calcPredictions(
      eventCodes, stats, coeffArbitre, coeffEnjeu
    )

    // Fallback : garantir au moins 2 prédictions
    if (predictions.length < 2) {
      const lambdaTotal = (stats.home.goals_avg || 1.3) + (stats.away.goals_avg || 1.0)
      const probOver = poissonOver(lambdaTotal, 2)
      const probA = 1 - poissonProb(stats.home.goals_avg || 1.3, 0)
      const probB = 1 - poissonProb(stats.away.goals_avg || 1.0, 0)
      const probBTTS = probA * probB

      if (!predictions.find(p => p.event_code.includes('buts'))) {
        predictions.push({
          event_code: 'total_buts_over',
          event_name: 'Total buts',
          threshold: probOver >= 0.5 ? '+ 2.5 buts' : '- 2.5 buts',
          event_type: 'binaire',
          probability: probOver >= 0.5 ? probOver : 1 - probOver,
          reasoning: `Lambda total : ${lambdaTotal.toFixed(2)} buts attendus pour ce match.`
        })
      }

      if (!predictions.find(p => p.event_code === 'btts') && probBTTS >= 0.40) {
        predictions.push({
          event_code: 'btts',
          event_name: 'Les deux équipes marquent',
          threshold: probBTTS >= 0.5 ? 'Oui' : 'Non',
          event_type: 'binaire',
          probability: probBTTS >= 0.5 ? probBTTS : 1 - probBTTS,
          reasoning: `Probabilité BTTS : ${(probBTTS * 100).toFixed(0)}% basée sur les moyennes offensives des deux équipes.`
        })
      }
    }

    const profileLabels: Record<string, string> = {
      P1: 'Équilibré / Ouvert',
      P2: 'Équilibré / Fermé',
      P3: 'Déséquilibré / Ouvert',
      P4: 'Déséquilibré / Fermé',
      P5: 'Asymétrique / Motivationnel'
    }

    const systemPrompt = `Tu es un expert en analyse de matchs de football.
Tu rédiges des analyses courtes, claires et en français simple pour des parieurs africains.
Maximum 3 phrases par section.
Tu retournes UNIQUEMENT un JSON valide, aucun texte avant ou après.`

    const userPrompt = `Analyse ce match précis et génère des textes spécifiques à ces deux équipes.

Match : ${fixture.teams.home.name} vs ${fixture.teams.away.name}
Compétition : ${fixture.league.name} — ${fixture.league.country}
Journée/Phase : ${fixture.league.round || 'Non précisé'}
Profil calculé : ${profileLabels[profile]}
Score Axe1 (rapport de force) : ${scoreAxe1}/10
Score Axe2 (intensité) : ${scoreAxe2}/10

Stats ${fixture.teams.home.name} :
- Buts marqués/match : ${stats.home.goals_avg}
- Corners/match : ${stats.home.corners_avg}
- Classement : ${homeStanding ? homeStanding.rank + 'e sur ' + totalTeams : 'N/A'}
- Points : ${homeStanding?.points || 'N/A'}

Stats ${fixture.teams.away.name} :
- Buts marqués/match : ${stats.away.goals_avg}
- Corners/match : ${stats.away.corners_avg}
- Classement : ${awayStanding ? awayStanding.rank + 'e sur ' + totalTeams : 'N/A'}
- Points : ${awayStanding?.points || 'N/A'}

Événements porteurs identifiés :
${predictions.map(p => `- ${p.event_name} : ${p.threshold} (${(p.probability * 100).toFixed(0)}%)`).join('\n')}

IMPORTANT : Cite les vrais noms des équipes dans chaque explication. Sois précis et spécifique. Maximum 3 phrases par section.

Retourne UNIQUEMENT ce JSON valide :
{
  "context_text": "contexte spécifique à ce match (2-3 phrases, présent/futur, cite les équipes par leur vrai nom)",
  "scenario_label": "${profileLabels[profile]}",
  "scenario_text": "physionomie attendue du match (2-3 phrases, spécifique à ces équipes)",
  "predictions_reasoning": {
    ${predictions.map(p => `"${p.event_code}": "explication 2 phrases pourquoi ${p.event_name} est porteur pour ${fixture.teams.home.name} vs ${fixture.teams.away.name} spécifiquement"`).join(',\n    ')}
  }
}`

    let llmData: any = {}
    try {
      const llmResponse = await callLLM(userPrompt, systemPrompt)
      const cleaned = llmResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      llmData = JSON.parse(cleaned)
    } catch (e) {
      console.error('LLM parse error:', e)
      llmData = {
        context_text: `${fixture.teams.home.name} affronte ${fixture.teams.away.name} dans le cadre de ${fixture.league.name}.`,
        scenario_label: profileLabels[profile],
        scenario_text: `Un match de type ${profileLabels[profile]} est attendu.`,
        predictions_reasoning: {}
      }
    }

    const enrichedPredictions = predictions.map((p, idx) => ({
      ...p,
      reasoning: llmData.predictions_reasoning?.[p.event_code] || p.reasoning,
      display_order: idx + 1
    }))

    const { data: savedAnalysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .insert({
        match_id: match_id,
        profile_code: profile,
        profile_label: profileLabels[profile],
        score_axe1: scoreAxe1,
        score_axe2: scoreAxe2,
        confidence: scoreAxe1 >= 7 || scoreAxe2 >= 7
          ? 'HAUTE'
          : scoreAxe1 >= 4 && scoreAxe2 >= 4
            ? 'MOYENNE'
            : 'BASSE',
        context_text: llmData.context_text,
        scenario_label: llmData.scenario_label,
        scenario_text: llmData.scenario_text,
        has_press_conference: false
      })
      .select()
      .single()

    if (analysisError) throw analysisError

    if (enrichedPredictions.length > 0) {
      await supabaseAdmin.from('predictions').insert(
        enrichedPredictions.map(p => ({
          analysis_id: savedAnalysis.id,
          match_id: match_id,
          event_code: p.event_code,
          event_name: p.event_name,
          threshold: p.threshold,
          event_type: p.event_type,
          interval_text: p.interval_text || null,
          probability: p.probability,
          reasoning: p.reasoning,
          display_order: p.display_order
        }))
      )
    }

    // 6. Increment daily quota
    const { error: upsertError } = await supabaseAdmin
      .from('daily_quota')
      .upsert({
        user_id: userId,
        quota_date: today,
        count: currentCount + 1
      }, { onConflict: 'user_id,quota_date' })

    if (upsertError) {
      console.error('Quota upsert error:', upsertError)
    }

    const result = {
      ...savedAnalysis,
      predictions: enrichedPredictions
    }

    return new Response(
      JSON.stringify({ success: true, cached: false, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('analyze-match error:', error)
    return new Response(
      JSON.stringify({ error: GENERIC_ERROR }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})