// 测试对局录入脚本
// 运行: node scripts/test-submit.mjs

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 请在 .env 文件中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const matchData = {
  game_time: "2026-04-21T01:39:00.000Z",
  duration: 977,
  winner_team: "blue",
  players: [
    {"player_name":"林子祥","team":"blue","hero_name":"德莱厄斯","hero_role":"tank","kills":5,"deaths":10,"assists":19,"damage":23700,"damage_taken":54700,"healing":12500},
    {"player_name":"河山统一","team":"red","hero_name":"蛮王","hero_role":"damage","kills":10,"deaths":7,"assists":17,"damage":18500,"damage_taken":36400,"healing":20699},
    {"player_name":"老坑b丶","team":"blue","hero_name":"剑圣","hero_role":"damage","kills":10,"deaths":10,"assists":13,"damage":28900,"damage_taken":24500,"healing":3500},
    {"player_name":"请务必保护小白","team":"blue","hero_name":"铸星龙王","hero_role":"damage","kills":8,"deaths":6,"assists":36,"damage":46100,"damage_taken":27500,"healing":9300},
    {"player_name":"硬核巨星","team":"blue","hero_name":"霞","hero_role":"damage","kills":21,"deaths":8,"assists":14,"damage":51600,"damage_taken":24300,"healing":5898},
    {"player_name":"第一上单丶001","team":"blue","hero_name":"璐璐","hero_role":"support","kills":1,"deaths":8,"assists":36,"damage":13200,"damage_taken":19800,"healing":3300},
    {"player_name":"我不想丸啦","team":"red","hero_name":"莉莉娅","hero_role":"damage","kills":12,"deaths":9,"assists":18,"damage":51100,"damage_taken":42200,"healing":18200},
    {"player_name":"我在冰冷的世界中","team":"red","hero_name":"古拉加斯","hero_role":"damage","kills":3,"deaths":8,"assists":12,"damage":21700,"damage_taken":30400,"healing":7200},
    {"player_name":"打野在旅游","team":"red","hero_name":"金克丝","hero_role":"damage","kills":16,"deaths":9,"assists":17,"damage":38200,"damage_taken":22400,"healing":2800},
    {"player_name":"开完记得保养哟","team":"red","hero_name":"芮尔","hero_role":"support","kills":0,"deaths":12,"assists":21,"damage":13700,"damage_taken":51800,"healing":2300}
  ]
}

async function submitMatch() {
  console.log('开始录入对局...')
  console.log('Supabase URL:', supabaseUrl)

  try {
    // 1. 处理玩家：查找或创建
    const playerIdMap = new Map()

    for (const player of matchData.players) {
      const name = player.player_name

      // 查找现有玩家
      const { data: existingPlayer, error: findError } = await supabase
        .from('players')
        .select('player_id')
        .eq('name', name)
        .single()

      if (existingPlayer) {
        console.log(`玩家 "${name}" 已存在，ID: ${existingPlayer.player_id}`)
        playerIdMap.set(name, existingPlayer.player_id)
      } else {
        // 创建新玩家
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ name })
          .select('player_id')
          .single()

        if (createError) {
          console.error(`创建玩家 "${name}" 失败:`, createError)
          throw createError
        }
        console.log(`创建玩家 "${name}" 成功，ID: ${newPlayer.player_id}`)
        playerIdMap.set(name, newPlayer.player_id)
      }
    }

    // 2. 创建对局
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        game_time: matchData.game_time,
        duration: matchData.duration,
        mode: '海克斯乱斗',
        winner_team: matchData.winner_team,
        source: 'manual'
      })
      .select('match_id')
      .single()

    if (matchError) throw matchError
    console.log(`创建对局成功，ID: ${match.match_id}`)

    // 3. 创建对局玩家记录
    const matchPlayers = matchData.players.map(p => ({
      match_id: match.match_id,
      player_id: playerIdMap.get(p.player_name),
      team: p.team,
      hero_id: null,
      hero_name: p.hero_name,
      hero_role: p.hero_role,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      damage: p.damage,
      damage_taken: p.damage_taken,
      healing: p.healing,
      is_winner: p.team === matchData.winner_team
    }))

    const { error: playersError } = await supabase
      .from('match_players')
      .insert(matchPlayers)

    if (playersError) throw playersError
    console.log(`创建 ${matchPlayers.length} 个对局玩家记录成功`)

    console.log('\n✅ 对局录入成功！')
    console.log(`- 对局ID: ${match.match_id}`)
    console.log(`- 玩家数: ${matchPlayers.length}`)
    console.log(`- 获胜方: ${matchData.winner_team === 'blue' ? '蓝方' : '红方'}`)

  } catch (error) {
    console.error('\n❌ 录入失败:', error)
    process.exit(1)
  }
}

submitMatch()