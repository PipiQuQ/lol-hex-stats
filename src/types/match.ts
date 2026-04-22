export interface Match {
  match_id: string
  game_time: string
  duration: number
  mode: string
  winner_team: string
}

export interface MatchPlayer {
  match_id: string
  player_id: string
  team: string
  hero_id: string
  hero_name: string
  hero_role: string
  kills: number
  deaths: number
  assists: number
  damage: number
  damage_taken: number
  healing: number
  is_winner: boolean
}

export interface MatchDetail extends Match {
  players: MatchPlayer[]
}
