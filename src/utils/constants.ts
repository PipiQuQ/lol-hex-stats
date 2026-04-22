import type { HeroRole } from '@/types/player'

export const MIN_MATCHES_THRESHOLD = 5
export const DAILY_BEST_MIN_MATCHES = 2

export const SCORE_WEIGHTS = {
  win_rate: 0.40,
  performance: 0.40,
  stability: 0.20
} as const

export const ROLE_WEIGHTS: Record<HeroRole, Record<string, number>> = {
  mage: { damage: 0.40, kda: 0.40, assists: 0.20 },
  marksman: { damage: 0.35, kills: 0.35, kda: 0.30 },
  tank: { damage_taken: 0.35, kda: 0.30, assists: 0.25, cc: 0.10 },
  support: { assists: 0.35, healing: 0.30, kda: 0.20, cc: 0.15 },
  assassin: { kills: 0.40, damage: 0.40, kda: 0.20 },
  fighter: { damage: 0.30, damage_taken: 0.25, kills: 0.25, kda: 0.20 }
}
