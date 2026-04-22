import { getSupabase } from '../../lib/supabase.js'

export async function onRequestPost(context) {
  const { request, env } = context

  const supabase = getSupabase(env)
  if (!supabase) {
    return new Response(JSON.stringify({ error: '数据库未连接' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await request.json()
    const { game_time, duration, winner_team, players } = body

    if (!game_time || !duration || !winner_team || !players || players.length < 2) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (winner_team !== 'blue' && winner_team !== 'red') {
      return new Response(JSON.stringify({ error: 'winner_team必须是blue或red' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const hasWinnerTeamPlayers = players.some(p => p.team === winner_team)
    if (!hasWinnerTeamPlayers) {
      return new Response(JSON.stringify({ error: '获胜队伍必须有玩家' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 处理玩家
    const playerIdMap = new Map()

    for (const player of players) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('player_id')
        .eq('name', player.player_name)
        .single()

      if (existingPlayer) {
        playerIdMap.set(player.player_name, existingPlayer.player_id)
      } else {
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ name: player.player_name })
          .select('player_id')
          .single()

        if (createError) throw createError
        playerIdMap.set(player.player_name, newPlayer.player_id)
      }
    }

    // 创建对局
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        game_time,
        duration,
        mode: '海克斯乱斗',
        winner_team,
        source: 'manual'
      })
      .select()
      .single()

    if (matchError) throw matchError

    // 创建对局玩家记录
    const matchPlayers = players.map(p => ({
      match_id: match.match_id,
      player_id: playerIdMap.get(p.player_name),
      team: p.team,
      hero_id: null,
      hero_name: p.hero_name,
      hero_role: p.hero_role,
      kills: p.kills || 0,
      deaths: p.deaths || 0,
      assists: p.assists || 0,
      damage: p.damage || 0,
      damage_taken: p.damage_taken || 0,
      healing: p.healing || 0,
      is_winner: p.team === winner_team
    }))

    const { error: playersError } = await supabase
      .from('match_players')
      .insert(matchPlayers)

    if (playersError) throw playersError

    return new Response(JSON.stringify({
      match_id: match.match_id,
      game_time: match.game_time,
      duration: match.duration,
      winner_team: match.winner_team,
      players_count: players.length
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message || '创建对局失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}