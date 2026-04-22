import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, isSupabaseConnected } from './lib/supabase'
import {
  calculatePerformanceScore,
  calculateStabilityScore,
  calculateCompositeScore,
  isScoreReliable
} from './lib/scoring'
import type { HeroRole } from '../src/types/player'

interface RankingEntry {
  rank: number
  player_id: string
  name: string
  avatar: string
  total_matches: number
  win_rate: number
  composite_score: number
  performance_score: number
  stability_score: number
  is_reliable: boolean
}

interface PlayerMatchData {
  player_id: string
  name: string
  avatar: string
  matches: {
    hero_role: HeroRole
    kills: number
    deaths: number
    assists: number
    damage: number
    damage_taken: number
    healing: number
    is_winner: boolean
    game_time: string
  }[]
}

function calculatePlayerRankings(playersData: PlayerMatchData[]): RankingEntry[] {
  const rankings: RankingEntry[] = []

  for (const player of playersData) {
    const matches = player.matches
    if (matches.length === 0) continue

    const wins = matches.filter(m => m.is_winner).length
    const winRate = wins / matches.length

    let totalPerformance = 0
    for (const match of matches) {
      const perfScore = calculatePerformanceScore(
        match.kills, match.deaths, match.assists,
        match.damage, match.damage_taken, match.healing,
        match.hero_role
      )
      totalPerformance += perfScore
    }
    const avgPerformanceScore = totalPerformance / matches.length

    const recentResults = matches
      .sort((a, b) => new Date(b.game_time).getTime() - new Date(a.game_time).getTime())
      .slice(0, 10)
      .map(m => m.is_winner)
    const stabilityScore = calculateStabilityScore(recentResults)

    const compositeScore = calculateCompositeScore(winRate, avgPerformanceScore, stabilityScore)

    rankings.push({
      rank: 0,
      player_id: player.player_id,
      name: player.name,
      avatar: player.avatar,
      total_matches: matches.length,
      win_rate: winRate,
      composite_score: Math.round(compositeScore),
      performance_score: Math.round(avgPerformanceScore),
      stability_score: stabilityScore,
      is_reliable: isScoreReliable(matches.length)
    })
  }

  rankings.sort((a, b) => b.composite_score - a.composite_score)
  rankings.forEach((r, i) => r.rank = i + 1)

  return rankings
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConnected()) {
    return res.status(503).json({ error: '数据库未连接，请配置Supabase环境变量' })
  }

  if (req.method === 'GET') {
    const { time_range = 'all' } = req.query || {}
    const timeRange = typeof time_range === 'string' ? time_range : 'all'

    try {
      let timeFilter = ''
      const now = new Date()
      if (timeRange === '7d') {
        timeFilter = new Date(now.getTime() - 7 * 86400000).toISOString()
      } else if (timeRange === '30d') {
        timeFilter = new Date(now.getTime() - 30 * 86400000).toISOString()
      }

      const { data: players, error: playersError } = await supabase!
        .from('players')
        .select('player_id, name, avatar')

      if (playersError) throw playersError

      let matchQuery = supabase!
        .from('match_players')
        .select(`
          player_id,
          hero_role,
          kills,
          deaths,
          assists,
          damage,
          damage_taken,
          healing,
          is_winner,
          matches!inner(game_time)
        `)

      if (timeFilter) {
        matchQuery = matchQuery.gte('matches.game_time', timeFilter)
      }

      const { data: matchPlayers, error: matchError } = await matchQuery

      if (matchError) throw matchError

      const playersData: PlayerMatchData[] = players.map((player: any) => ({
        player_id: player.player_id,
        name: player.name,
        avatar: player.avatar,
        matches: matchPlayers
          .filter((mp: any) => mp.player_id === player.player_id)
          .map((mp: any) => ({
            hero_role: mp.hero_role as HeroRole,
            kills: mp.kills,
            deaths: mp.deaths,
            assists: mp.assists,
            damage: mp.damage,
            damage_taken: mp.damage_taken,
            healing: mp.healing,
            is_winner: mp.is_winner,
            game_time: mp.matches.game_time
          }))
      }))

      const rankings = calculatePlayerRankings(playersData)
      res.status(200).json(rankings)
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: '获取排行榜失败' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}