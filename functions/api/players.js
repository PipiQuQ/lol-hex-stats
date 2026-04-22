import { getSupabase } from '../lib/supabase.js'

export async function onRequest(context) {
  const { env } = context

  const supabase = getSupabase(env)
  if (!supabase) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: players, error } = await supabase
    .from('players')
    .select('player_id, name, avatar')
    .order('name')

  if (error) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(players || []), {
    headers: { 'Content-Type': 'application/json' }
  })
}