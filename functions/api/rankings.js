import { getSupabase } from '../lib/supabase.js'

const ROLE_WEIGHTS = {
  mage: { damage: 0.40, kda: 0.40, assists: 0.20 },
  marksman: { damage: 0.35, kills: 0.35, kda: 0.30 },
  tank: { damage_taken: 0.35, kda: 0.30, assists: 0.25, cc: 0.10 },
  support: { assists: 0.35, healing: 0.30, kda: 0.20, cc: 0.15 },
  assassin: { kills: 0.40, damage: 0.40, kda: 0.20 },
  fighter: { damage: 0.30, damage_taken: 0.25, kills: 0.25, kda: 0.20 }
}

function calculateKDA(kills, deaths, assists) {
  if (deaths === 0) return kills + assists
  return (kills + assists) / deaths
}

function normalizeValue(value, max) {
  return Math.min(value / max, 1)
}

function calculatePerformanceScore(kills, deaths, assists, damage, damageTaken, healing, role) {
  const kda = calculateKDA(kills, deaths, assists)
  const weights = ROLE_WEIGHTS[role] || ROLE_WEIGHTS.mage
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
    default:
      score = normalizeValue(damage, 35000) * 0.4 +
        normalizeValue(kda, 6) * 0.4 +
        normalizeValue(assists, 12) * 0.2
  }
  return Math.min(score * 100, 100)
}

const MIN_MATCHES_THRESHOLD = 5

export async function onRequest(context) {
  const { env } = context

  const supabase = getSupabase(env)
  if (!supabase) {
    return new Response(JSON.stringify({ error: '数据库未连接' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('player_id, name, avatar, total_matches, total_wins, total_kills, total_deaths, total_assists, total_damage, total_damage_taken, total_healing')

  if (playersError) {
    return new Response(JSON.stringify({ error: playersError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const rankings = []

  for (const player of players || []) {
    const totalMatches = player.total_matches || 0
    const totalWins = player.total_wins || 0

    if (totalMatches === 0) continue

    const winRate = totalWins / totalMatches

    const avgKills = player.total_kills / totalMatches
    const avgDeaths = player.total_deaths / totalMatches
    const avgAssists = player.total_assists / totalMatches
    const avgDamage = player.total_damage / totalMatches
    const avgDamageTaken = player.total_damage_taken / totalMatches
    const avgHealing = player.total_healing / totalMatches

    const avgPerf = calculatePerformanceScore(
      avgKills, avgDeaths, avgAssists,
      avgDamage, avgDamageTaken, avgHealing,
      'mage'
    )

    const stability = totalMatches >= 5 ? 70 : 60
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

  rankings.sort((a, b) => b.composite_score - a.composite_score)
  rankings.forEach((r, i) => r.rank = i + 1)

  return new Response(JSON.stringify(rankings), {
    headers: { 'Content-Type': 'application/json' }
  })
}