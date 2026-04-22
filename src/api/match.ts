import { supabase } from './player'
import type { Match, MatchDetail, MatchPlayer } from '@/types/match'

interface AddMatchInput {
  game_time: string
  duration: number
  winner_team: 'blue' | 'red'
  players: Array<{
    player_name: string
    team: 'blue' | 'red'
    hero_name: string
    hero_role: string
    kills: number
    deaths: number
    assists: number
    damage: number
    damage_taken: number
    healing: number
  }>
}

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
  },

  // 添加对局（直接调用 Supabase）
  addMatch: async (input: AddMatchInput): Promise<{ match_id: string }> => {
    if (!supabase) {
      throw new Error('数据库未连接')
    }

    const { game_time, duration, winner_team, players } = input

    // 1. 处理玩家：查找或创建
    const playerIdMap: Map<string, string> = new Map()

    for (const player of players) {
      // 查找现有玩家
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('player_id')
        .eq('name', player.player_name)
        .single()

      if (existingPlayer) {
        playerIdMap.set(player.player_name, existingPlayer.player_id)
      } else {
        // 创建新玩家
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ name: player.player_name })
          .select('player_id')
          .single()

        if (createError) {
          if (createError.code === '23505') {
            // 名称已存在，重新查找
            const { data: retryPlayer } = await supabase
              .from('players')
              .select('player_id')
              .eq('name', player.player_name)
              .single()
            if (retryPlayer) {
              playerIdMap.set(player.player_name, retryPlayer.player_id)
            }
          } else {
            throw createError
          }
        } else {
          playerIdMap.set(player.player_name, newPlayer.player_id)
        }
      }
    }

    // 2. 创建对局
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        game_time,
        duration,
        mode: '海克斯乱斗',
        winner_team,
        source: 'manual'
      })
      .select('match_id')
      .single()

    if (matchError) throw matchError

    // 3. 创建对局玩家记录
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

    return { match_id: match.match_id }
  }
}