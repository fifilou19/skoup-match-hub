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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const apiKey = Deno.env.get('API_FOOTBALL_KEY')

    const today = new Date().toISOString().split('T')[0]

    const { data: watchlistItems } = await supabase
      .from('watchlist')
      .select('match_id, status')
      .gte('kickoff_at', today + 'T00:00:00Z')
      .not('status', 'in', '("FT","AET","PEN","AWD","ABD","WO")')

    if (!watchlistItems || watchlistItems.length === 0) {
      return new Response(
        JSON.stringify({ updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const matchIds = [...new Set(watchlistItems.map((i: any) => i.match_id))]

    const chunks: string[][] = []
    for (let i = 0; i < matchIds.length; i += 20) {
      chunks.push(matchIds.slice(i, i + 20))
    }

    let totalUpdated = 0

    for (const chunk of chunks) {
      const ids = chunk.join('-')
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?ids=${ids}`,
        {
          headers: {
            'x-rapidapi-key': apiKey!,
            'x-rapidapi-host': 'v3.football.api-sports.io',
          },
        }
      )
      const data = await res.json()
      const fixtures = data.response || []

      for (const fixture of fixtures) {
        const matchId = fixture.fixture.id.toString()
        const newStatus = fixture.fixture.status.short
        const newScoreHome = fixture.goals.home
        const newScoreAway = fixture.goals.away
        const newMinute = fixture.fixture.status.elapsed

        const { error } = await supabase
          .from('watchlist')
          .update({
            status: newStatus,
            score_home: newScoreHome,
            score_away: newScoreAway,
            minute: newMinute,
          })
          .eq('match_id', matchId)

        if (!error) totalUpdated++
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated: totalUpdated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
