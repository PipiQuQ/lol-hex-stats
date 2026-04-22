import { supabase } from './player'
import type { Match, MatchDetail, MatchPlayer } from '@/types/match'

export const matchApi = {
  getList: async (playerId?: string, limit = 20): Promise<Match[]> => {
    if (!supabase) {
      throw new Error('数据库未连接')
    }

    let query = supabase
      .from('matches')
      .select('match_id, game_time, duration, mode, winner_team, source, created_at')
      .order('game_time', { ascending: false })
      .limit(limit)

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  getDetail: async (matchId: string): Promise<MatchDetail> => {
    if (!supabase) {
      throw new Error('数据库未连接')
    }

    // 获取对局信息
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('match_id, game_time, duration, mode, winner_team')
      .eq('match_id', matchId)
      .single()

    if (matchError) throw matchError

    // 获取对局玩家
    const { data: players, error: playersError } = await supabase
      .from('match_players')
      .select('player_id, team, hero_id, hero_name, hero_role, kills, deaths, assists, damage, damage_taken, healing, is_winner')
      .eq('match_id', matchId)

    if (playersError) throw playersError

    // 添加 match_id 到每个玩家记录
    const matchPlayers: MatchPlayer[] = (players || []).map(p => ({
      match_id: matchId,
      ...p
    }))

    return {
      ...match,
      players: matchPlayers
    }
  }
}