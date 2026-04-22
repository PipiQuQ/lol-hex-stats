import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, isSupabaseConnected } from './lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConnected()) {
    return res.status(503).json({ error: '数据库未连接，请配置Supabase环境变量' })
  }

  if (req.method === 'GET') {
    const { limit = '20' } = req.query || {}

    try {
      const { data, error } = await supabase!
        .from('matches')
        .select(`
          match_id,
          game_time,
          duration,
          mode,
          winner_team,
          source,
          created_at
        `)
        .order('game_time', { ascending: false })
        .limit(Number(limit))

      if (error) throw error
      res.status(200).json(data || [])
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: '获取对局列表失败' })
    }
  } else if (req.method === 'POST') {
    const { game_time, duration, winner_team, players } = req.body || {}

    if (!game_time || !duration || !winner_team || !players) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    try {
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
      const matchPlayers = players.map((p: any) => ({
        match_id: match.match_id,
        player_id: p.player_id,
        team: p.team,
        hero_id: p.hero_id,
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

      res.status(201).json(match)
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: '创建对局失败' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}