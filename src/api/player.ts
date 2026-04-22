import { createClient } from '@supabase/supabase-js'
import type { Player, PlayerStats, HeroStat } from '@/types/player'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase配置缺失，请检查.env文件')
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 简化的玩家列表类型（用于下拉选择）
export interface PlayerListItem {
  player_id: string
  name: string
}

export const playerApi = {
  // 获取玩家列表（用于下拉选择）
  getList: async (): Promise<PlayerListItem[]> => {
    if (!supabase) {
      return []
    }
    const { data, error } = await supabase
      .from('players')
      .select('player_id, name')
      .order('name', { ascending: true })
    if (error) {
      console.error('获取玩家列表失败:', error)
      return []
    }
    return data || []
  },

  getAll: async (): Promise<Player[]> => {
    if (!supabase) {
      throw new Error('数据库未连接')
    }
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  // 获取玩家详情（包含统计数据）
  getDetail: async (playerId: string): Promise<PlayerStats> => {
    if (!supabase) {
      throw new Error('数据库未连接')
    }

    // 获取玩家基本信息
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('player_id', playerId)
      .single()

    if (playerError) throw playerError

    // 获取该玩家的所有对局数据 - 分开查询避免join错误
    const { data: matchPlayers, error: matchError } = await supabase
      .from('match_players')
      .select('match_id, hero_name, hero_role, kills, deaths, assists, damage, damage_taken, healing, is_winner')
      .eq('player_id', playerId)

    if (matchError) throw matchError

    // 获取对局时间
    const matchIds = (matchPlayers || []).map(mp => mp.match_id)
    let matchTimes: Record<string, string> = {}
    if (matchIds.length > 0) {
      const { data: matchesData } = await supabase
        .from('matches')
        .select('match_id, game_time')
        .in('match_id', matchIds)
      matchTimes = (matchesData || []).reduce((acc, m) => {
        acc[m.match_id] = m.game_time
        return acc
      }, {} as Record<string, string>)
    }

    const matches = (matchPlayers || []).map(mp => ({
      ...mp,
      game_time: matchTimes[mp.match_id] || new Date().toISOString()
    }))
    const totalMatches = matches.length
    const wins = matches.filter(m => m.is_winner).length
    const losses = totalMatches - wins
    const winRate = totalMatches > 0 ? wins / totalMatches : 0

    // 计算平均值
    const avgKills = totalMatches > 0 ? matches.reduce((sum, m) => sum + m.kills, 0) / totalMatches : 0
    const avgDeaths = totalMatches > 0 ? matches.reduce((sum, m) => sum + m.deaths, 0) / totalMatches : 0
    const avgAssists = totalMatches > 0 ? matches.reduce((sum, m) => sum + m.assists, 0) / totalMatches : 0
    const avgDamage = totalMatches > 0 ? matches.reduce((sum, m) => sum + m.damage, 0) / totalMatches : 0
    const avgDamageTaken = totalMatches > 0 ? matches.reduce((sum, m) => sum + m.damage_taken, 0) / totalMatches : 0
    const avgHealing = totalMatches > 0 ? matches.reduce((sum, m) => sum + m.healing, 0) / totalMatches : 0

    // 计算英雄统计
    const heroMap = new Map<string, { matches: number; wins: number }>()
    for (const m of matches) {
      const heroName = m.hero_name
      if (!heroMap.has(heroName)) {
        heroMap.set(heroName, { matches: 0, wins: 0 })
      }
      const stats = heroMap.get(heroName)!
      stats.matches++
      if (m.is_winner) stats.wins++
    }

    const heroStats: HeroStat[] = Array.from(heroMap.entries())
      .map(([heroName, stats]) => ({
        hero_id: heroName,
        hero_name: heroName,
        matches: stats.matches,
        wins: stats.wins,
        win_rate: stats.matches > 0 ? stats.wins / stats.matches : 0
      }))
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 5)

    // 计算评分（简化版）
    const compositeScore = Math.round(winRate * 100 * 0.4 + 60 * 0.4 + 60 * 0.2)

    return {
      player_id: player.player_id,
      name: player.name,
      avatar: player.avatar || '',
      total_matches: totalMatches,
      wins,
      losses,
      win_rate: winRate,
      avg_kills: avgKills,
      avg_deaths: avgDeaths,
      avg_assists: avgAssists,
      avg_damage: avgDamage,
      avg_damage_taken: avgDamageTaken,
      avg_healing: avgHealing,
      composite_score: compositeScore,
      performance_score: 60,
      stability_score: 60,
      hero_stats: heroStats
    }
  },

  addPlayer: async (name: string, gameId?: string): Promise<Player> => {
    if (!supabase) {
      throw new Error('数据库未连接')
    }
    const { data, error } = await supabase
      .from('players')
      .insert({ name, game_id: gameId || null })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') {
        throw new Error('玩家名称已存在')
      }
      throw error
    }
    return data
  }
}