import type { HeroRole } from '../../src/types/player'

export const MIN_MATCHES_THRESHOLD = 5

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

export function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists
  return (kills + assists) / deaths
}

export function normalizeValue(value: number, max: number): number {
  return Math.min(value / max, 1)
}

export function calculatePerformanceScore(
  kills: number,
  deaths: number,
  assists: number,
  damage: number,
  damageTaken: number,
  healing: number,
  role: HeroRole
): number {
  const kda = calculateKDA(kills, deaths, assists)
  const weights = ROLE_WEIGHTS[role]

  let score = 0

  switch (role) {
    case 'mage':
      score +=
        normalizeValue(damage, 35000) * weights.damage +
        normalizeValue(kda, 6) * weights.kda +
        normalizeValue(assists, 12) * weights.assists
      break
    case 'marksman':
      score +=
        normalizeValue(damage, 40000) * weights.damage +
        normalizeValue(kills, 12) * weights.kills +
        normalizeValue(kda, 8) * weights.kda
      break
    case 'tank':
      score +=
        normalizeValue(damageTaken, 35000) * weights.damage_taken +
        normalizeValue(kda, 5) * weights.kda +
        normalizeValue(assists, 18) * weights.assists +
        0.7 * (weights.cc || 0)
      break
    case 'support':
      score +=
        normalizeValue(assists, 20) * weights.assists +
        normalizeValue(healing, 20000) * (weights.healing || 0) +
        normalizeValue(kda, 4) * weights.kda +
        0.7 * (weights.cc || 0)
      break
    case 'assassin':
      score +=
        normalizeValue(kills, 15) * weights.kills +
        normalizeValue(damage, 45000) * weights.damage +
        normalizeValue(kda, 10) * weights.kda
      break
    case 'fighter':
      score +=
        normalizeValue(damage, 30000) * weights.damage +
        normalizeValue(damageTaken, 25000) * weights.damage_taken +
        normalizeValue(kills, 10) * weights.kills +
        normalizeValue(kda, 6) * weights.kda
      break
  }

  return Math.min(score * 100, 100)
}

export function calculateStabilityScore(recentResults: boolean[]): number {
  if (recentResults.length < 3) return 60

  let wins = 0
  for (const result of recentResults) {
    if (result) wins++
  }

  const winRate = wins / recentResults.length
  const variance = winRate * (1 - winRate)

  if (variance < 0.10) return 100
  if (variance < 0.20) return 80
  if (variance < 0.30) return 60
  return 40
}

export function calculateCompositeScore(
  winRate: number,
  performanceScore: number,
  stabilityScore: number
): number {
  return (
    winRate * 100 * SCORE_WEIGHTS.win_rate +
    performanceScore * SCORE_WEIGHTS.performance +
    stabilityScore * SCORE_WEIGHTS.stability
  )
}

export function isScoreReliable(totalMatches: number): boolean {
  return totalMatches >= MIN_MATCHES_THRESHOLD
}

export function calculateDailyBestScore(
  dailyWinRate: number,
  dailyPerformanceScore: number
): number {
  return dailyWinRate * 100 * 0.5 + dailyPerformanceScore * 0.5
}