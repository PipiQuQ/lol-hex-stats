export interface Player {
  player_id: string
  name: string
  avatar: string
  game_id: string | null
  created_at: string
  // 累计汇总字段
  total_kills: number
  total_deaths: number
  total_assists: number
  total_damage: number
  total_damage_taken: number
  total_healing: number
  total_matches: number
  total_wins: number
}

export type HeroRole = 'tank' | 'fighter' | 'support' | 'assassin' | 'mage' | 'marksman'

export interface PlayerStats {
  player_id: string
  name: string
  avatar: string
  total_matches: number
  wins: number
  losses: number
  win_rate: number
  avg_kills: number
  avg_deaths: number
  avg_assists: number
  avg_damage: number
  avg_damage_taken: number
  avg_healing: number
  composite_score: number
  performance_score: number
  stability_score: number
  hero_stats: HeroStat[]
}

export interface HeroStat {
  hero_id: string
  hero_name: string
  matches: number
  wins: number
  win_rate: number
}
