import { supabase } from './player'
import type { RankingEntry, DailyBest, TimeRange } from '@/types/ranking'
import type { HeroRole } from '@/types/player'

// 评分计算函数
function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists
  return (kills + assists) / deaths
}

function normalizeValue(value: number, max: number): number {
  return Math.min(value / max, 1)
}

const ROLE_WEIGHTS: Record<HeroRole, Record<string, number>> = {
  mage: { damage: 0.40, kda: 0.40, assists: 0.20 },
  marksman: { damage: 0.35, kills: 0.35, kda: 0.30 },
  tank: { damage_taken: 0.35, kda: 0.30, assists: 0.25, cc: 0.10 },
  support: { assists: 0.35, healing: 0.30, kda: 0.20, cc: 0.15 },
  assassin: { kills: 0.40, damage: 0.40, kda: 0.20 },
  fighter: { damage: 0.30, damage_taken: 0.25, kills: 0.25, kda: 0.20 }
}

function calculatePerformanceScore(
  kills: number, deaths: number, assists: number,
  damage: number, damageTaken: number, healing: number,
  role: HeroRole
): number {
  const kda = calculateKDA(kills, deaths, assists)
  const weights = ROLE_WEIGHTS[role]
  let score = 0

  switch (role) {
    case 'mage':
      score = normalizeValue(damage, 35000) * weights.damage +
        normalizeValue(kda, 6) * weights.kda +
        normalizeValue(assists, 12) * weights.assists
      break
    case 'marksman':
      score = normalizeValue(damage, 40000) * weights.damage +
        normalizeValue(kills, 12) * weights.kills +
        normalizeValue(kda, 8) * weights.kda
      break
    case 'tank':
      score = normalizeValue(damageTaken, 35000) * weights.damage_taken +
        normalizeValue(kda, 5) * weights.kda +
        normalizeValue(assists, 18) * weights.assists + 0.7 * (weights.cc || 0)
      break
    case 'support':
      score = normalizeValue(assists, 20) * weights.assists +
        normalizeValue(healing, 20000) * (weights.healing || 0) +
        normalizeValue(kda, 4) * weights.kda + 0.7 * (weights.cc || 0)
      break
    case 'assassin':
      score = normalizeValue(kills, 15) * weights.kills +
        normalizeValue(damage, 45000) * weights.damage +
        normalizeValue(kda, 10) * weights.kda
      break
    case 'fighter':
      score = normalizeValue(damage, 30000) * weights.damage +
        normalizeValue(damageTaken, 25000) * weights.damage_taken +
        normalizeValue(kills, 10) * weights.kills +
        normalizeValue(kda, 6) * weights.kda
      break
  }
  return Math.min(score * 100, 100)
}

const MIN_MATCHES_THRESHOLD = 5

export const rankingApi = {
  getRankings: async (range: TimeRange = 'all'): Promise<RankingEntry[]> => {
    if (!supabase) {
      throw new Error('数据库未连接')
    }

    // 直接从 players 表获取累计数据
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('player_id, name, avatar, total_matches, total_wins, total_kills, total_deaths, total_assists, total_damage, total_damage_taken, total_healing')

    if (playersError) throw playersError

    const rankings: RankingEntry[] = []

    for (const player of players || []) {
      const totalMatches = player.total_matches || 0
      const totalWins = player.total_wins || 0

      if (totalMatches === 0) continue

      const winRate = totalWins / totalMatches

      // 计算平均值
      const avgKills = player.total_kills / totalMatches
      const avgDeaths = player.total_deaths / totalMatches
      const avgAssists = player.total_assists / totalMatches
      const avgDamage = player.total_damage / totalMatches
      const avgDamageTaken = player.total_damage_taken / totalMatches
      const avgHealing = player.total_healing / totalMatches

      // 简化评分：使用默认role计算
      const avgPerf = calculatePerformanceScore(
        avgKills, avgDeaths, avgAssists,
        avgDamage, avgDamageTaken, avgHealing,
        'mage' // 默认用mage定位
      )

      // 简化稳定性评分
      const stability = totalMatches >= 5 ? 70 : 60

      // 综合评分
      const composite = winRate * 100 * 0.4 + avgPerf * 0.4 + stability * 0.2

      rankings.push({
        rank: 0,
        player_id: player.player_id,
        name: player.name,
        avatar: player.avatar || '',
        total_matches: totalMatches,
        win_rate: winRate,
        composite_score: Math.round(composite),
        performance_score: Math.round(avgPerf),
        stability_score: stability,
        is_reliable: totalMatches >= MIN_MATCHES_THRESHOLD
      })
    }

    // 排序
    rankings.sort((a, b) => b.composite_score - a.composite_score)
    rankings.forEach((r, i) => r.rank = i + 1)

    return rankings
  },

  getDailyBest: async (date?: string): Promise<DailyBest | null> => {
    if (!supabase) {
      throw new Error('数据库未连接')
    }

    const targetDate = date || new Date().toISOString().split('T')[0]

    // 暂时返回null（当日数据计算较复杂）
    // 后续可以添加每日最佳计算逻辑
    return null
  }
}