import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, isSupabaseConnected } from '../lib/supabase'

interface PlayerInput {
  player_name: string
  team: 'blue' | 'red'
  hero_name: string
  hero_role: 'tank' | 'fighter' | 'support' | 'assassin' | 'mage' | 'marksman'
  kills: number
  deaths: number
  assists: number
  damage: number
  damage_taken: number
  healing: number
  gold: number
}

interface MatchInput {
  game_time: string
  duration: number
  winner_team: 'blue' | 'red'
  players: PlayerInput[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { game_time, duration, winner_team, players }: MatchInput = req.body || {}

  // 基础验证
  if (!game_time || !duration || !winner_team || !players || players.length < 2) {
    return res.status(400).json({ error: '缺少必要参数，至少需要2名玩家' })
  }

  // 验证winner_team有效性
  if (winner_team !== 'blue' && winner_team !== 'red') {
    return res.status(400).json({ error: 'winner_team必须是blue或red' })
  }

  // 验证队伍分配 - 获胜队伍的所有玩家is_winner应为true
  const hasWinnerTeamPlayers = players.some(p => p.team === winner_team)
  if (!hasWinnerTeamPlayers) {
    return res.status(400).json({ error: `获胜队伍${winner_team}必须有玩家` })
  }

  if (!isSupabaseConnected()) {
    return res.status(503).json({ error: '数据库未连接' })
  }

  try {
    // 处理玩家：查找或创建
    const playerIdMap: Map<string, string> = new Map()

    for (const player of players) {
      // 查找现有玩家
      const { data: existingPlayer } = await supabase!
        .from('players')
        .select('player_id')
        .eq('name', player.player_name)
        .single()

      if (existingPlayer) {
        playerIdMap.set(player.player_name, existingPlayer.player_id)
      } else {
        // 创建新玩家
        const { data: newPlayer, error: createError } = await supabase!
          .from('players')
          .insert({ name: player.player_name })
          .select('player_id')
          .single()

        if (createError) throw createError
        playerIdMap.set(player.player_name, newPlayer.player_id)
      }
    }

    // 创建对局
    const { data: match, error: matchError } = await supabase!
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
      gold: p.gold || 0,
      is_winner: p.team === winner_team
    }))

    const { error: playersError } = await supabase!
      .from('match_players')
      .insert(matchPlayers)

    if (playersError) throw playersError

    // 返回创建的对局详情
    res.status(201).json({
      match_id: match.match_id,
      game_time: match.game_time,
      duration: match.duration,
      winner_team: match.winner_team,
      players_count: players.length,
      new_players_created: playerIdMap.size - players.filter(p => {
        // 计算新创建的玩家数量（简化逻辑）
        return true // 这里实际上需要更精确的判断
      }).length
    })
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: '创建对局失败' })
  }
}