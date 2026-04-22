import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, isSupabaseConnected } from './lib/supabase'
import {
  calculatePerformanceScore,
  calculateDailyBestScore
} from './lib/scoring'
import type { HeroRole } from '../src/types/player'

interface DailyBest {
  player_id: string
  name: string
  avatar: string
  date: string
  daily_score: number
  win_rate_today: number
  performance_score_today: number
  matches_today: number
  wins_today: number
  losses_today: number
}

const DAILY_BEST_MIN_MATCHES = 2

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConnected()) {
    return res.status(503).json({ error: '数据库未连接，请配置Supabase环境变量' })
  }

  if (req.method === 'GET') {
    const { date } = req.query || {}
    const targetDate = typeof date === 'string' ? date : new Date().toISOString().split('T')[0]

    try {
      const dayStart = new Date(targetDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(targetDate)
      dayEnd.setHours(23, 59, 59, 999)

      const { data: matchPlayers, error } = await supabase!
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
          players!inner(player_id, name, avatar)
        `)
        .gte('matches.game_time', dayStart.toISOString())
        .lte('matches.game_time', dayEnd.toISOString())

      if (error) throw error

      if (!matchPlayers || matchPlayers.length === 0) {
        return res.status(200).json(null)
      }

      // 按玩家分组计算当日数据
      const playerDailyData: Map<string, {
        player_id: string
        name: string
        avatar: string
        matches: any[]
      }> = new Map()

      for (const mp of matchPlayers) {
        const playerId = mp.player_id as string
        const playersData = mp.players as any
        if (!playerDailyData.has(playerId)) {
          playerDailyData.set(playerId, {
            player_id: playerId,
            name: Array.isArray(playersData) ? playersData[0]?.name : playersData?.name || '',
            avatar: Array.isArray(playersData) ? playersData[0]?.avatar : playersData?.avatar || '',
            matches: []
          })
        }
        playerDailyData.get(playerId)!.matches.push(mp)
      }

      // 计算每个玩家的当日评分
      const dailyScores: DailyBest[] = []

      for (const [playerId, data] of playerDailyData) {
        if (data.matches.length < DAILY_BEST_MIN_MATCHES) continue

        const wins = data.matches.filter(m => m.is_winner).length
        const winRateToday = wins / data.matches.length

        // 计算当日平均表现分
        let totalPerformance = 0
        for (const match of data.matches) {
          const perfScore = calculatePerformanceScore(
            match.kills, match.deaths, match.assists,
            match.damage, match.damage_taken, match.healing,
            match.hero_role as HeroRole
          )
          totalPerformance += perfScore
        }
        const avgPerformanceToday = totalPerformance / data.matches.length

        const dailyScore = calculateDailyBestScore(winRateToday, avgPerformanceToday)

        dailyScores.push({
          player_id: playerId,
          name: data.name,
          avatar: data.avatar,
          date: targetDate,
          daily_score: Math.round(dailyScore),
          win_rate_today: winRateToday,
          performance_score_today: Math.round(avgPerformanceToday),
          matches_today: data.matches.length,
          wins_today: wins,
          losses_today: data.matches.length - wins
        })
      }

      if (dailyScores.length === 0) {
        return res.status(200).json(null)
      }

      const bestPlayer = dailyScores.sort((a, b) => b.daily_score - a.daily_score)[0]
      res.status(200).json(bestPlayer)
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: '获取每日最佳失败' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}