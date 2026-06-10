// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const rawMatchId = body.match_id
    const numericId = parseInt(rawMatchId, 10)
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid match_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const match_id = numericId.toString()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // No early return here — we check after generating context, before writing


    const apiKey = Deno.env.get('API_FOOTBALL_KEY')
    const apiHeaders = {
      'x-rapidapi-key': apiKey!,
      'x-rapidapi-host': 'v3.football.api-sports.io'
    }

    const fixtureRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${match_id}`,
      { headers: apiHeaders }
    )
    const fixtureData = await fixtureRes.json()
    const fixture = fixtureData.response?.[0]

    if (!fixture) {
      return new Response(
        JSON.stringify({ context_text: 'Données du match non disponibles.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const [standingRes, injuriesRes] = await Promise.all([
      fetch(
        `https://v3.football.api-sports.io/standings?league=${fixture.league.id}&season=${fixture.league.season}`,
        { headers: apiHeaders }
      ),
      fetch(
        `https://v3.football.api-sports.io/injuries?fixture=${match_id}`,
        { headers: apiHeaders }
      ),
    ])

    const standingData = await standingRes.json()
    const standings = standingData.response?.[0]?.league?.standings?.[0] || []
    const homeStanding = standings.find((s: any) => s.team.id === fixture.teams.home.id)
    const awayStanding = standings.find((s: any) => s.team.id === fixture.teams.away.id)

    const injuriesData = await injuriesRes.json()
    const injuries = (injuriesData.response || []).slice(0, 5).map((i: any) => ({
      team: i.team.name,
      player: i.player.name,
      type: i.player.type,
    }))

    const ctx = {
      home: {
        name: fixture.teams.home.name,
        rank: homeStanding?.rank || 'N/A',
        points: homeStanding?.points || 'N/A',
        form: homeStanding?.form || 'N/A',
      },
      away: {
        name: fixture.teams.away.name,
        rank: awayStanding?.rank || 'N/A',
        points: awayStanding?.points || 'N/A',
        form: awayStanding?.form || 'N/A',
      },
      competition: fixture.league.name,
      round: fixture.league.round,
    }

    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          {
            role: 'system',
            content: 'Tu es un expert en football. Tu rédiges des contextes de match courts et précis en français simple pour des parieurs africains. Maximum 3 phrases. Pas de jargon. Retourne uniquement le texte, aucune balise JSON.'
          },
          {
            role: 'user',
            content: `Rédige le contexte de ce match en 2-3 phrases :
${ctx.home.name} (${ctx.home.rank}e, ${ctx.home.points} pts) vs ${ctx.away.name} (${ctx.away.rank}e, ${ctx.away.points} pts)
Compétition : ${ctx.competition} - ${ctx.round}
Forme domicile : ${ctx.home.form}
Forme extérieur : ${ctx.away.form}
${injuries.length > 0 ? 'Absences : ' + injuries.map((i) => `${i.player} (${i.team})`).join(', ') : ''}

Mentionne les enjeux, la forme récente et les absences importantes si disponibles.`
          }
        ]
      })
    })

    const llmData = await llmRes.json()
    const context_text = llmData.choices?.[0]?.message?.content?.trim() ||
      `${fixture.teams.home.name} affronte ${fixture.teams.away.name} dans le cadre de ${fixture.league.name}.`

    await supabase.from('analyses').upsert({
      match_id,
      context_text,
      profile_code: 'PENDING',
      profile_label: "En attente d'analyse",
      score_axe1: 0,
      score_axe2: 0,
      confidence: 'MOYENNE',
      scenario_label: '',
      scenario_text: '',
    }, { onConflict: 'match_id', ignoreDuplicates: false })

    return new Response(
      JSON.stringify({ context_text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('generate-context error:', error)
    return new Response(
      JSON.stringify({ error: 'Context generation unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
