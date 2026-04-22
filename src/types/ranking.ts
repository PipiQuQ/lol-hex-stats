export interface RankingEntry {
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

export interface DailyBest {
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

export type TimeRange = '7d' | '30d' | 'all'
