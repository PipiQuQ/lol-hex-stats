<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { playerApi, type PlayerListItem } from '@/api/player'
import { adminApi } from '@/api/index'
import { useRouter } from 'vue-router'
import { getHeroNames } from '@/data/heroes'

// 英雄名称列表
const heroNames = getHeroNames()

const router = useRouter()

// 固定选项
const TEAM_OPTIONS = [
  { value: 'blue', label: '蓝方' },
  { value: 'red', label: '红方' }
]

const HERO_ROLE_OPTIONS = [
  { value: 'tank', label: '坦克' },
  { value: 'fighter', label: '战士' },
  { value: 'support', label: '辅助' },
  { value: 'assassin', label: '刺客' },
  { value: 'mage', label: '法师' },
  { value: 'marksman', label: '射手' }
]

// 状态
const players = ref<PlayerListItem[]>([])
const loading = ref(false)
const submitting = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// 对局数据
const matchData = ref({
  game_time: new Date().toISOString().slice(0, 16),
  duration_minutes: '20:00', // 格式: mm:ss
  winner_team: 'blue' as 'blue' | 'red',
  players: [] as Array<{
    player_id: string
    player_name: string
    team: 'blue' | 'red'
    hero_name: string
    hero_role: 'tank' | 'fighter' | 'support' | 'assassin' | 'mage' | 'marksman'
    kills: number
    deaths: number
    assists: number
    damage: number
    damage_taken: number
    healing: number
  }>
})

// 将 mm:ss 格式转换为秒数
function parseDuration(durationStr: string): number {
  const parts = durationStr.split(':')
  if (parts.length !== 2) return 1200
  const minutes = parseInt(parts[0] || '0', 10)
  const seconds = parseInt(parts[1] || '0', 10)
  return minutes * 60 + seconds
}

// 添加玩家行
function addPlayerRow(team: 'blue' | 'red') {
  matchData.value.players.push({
    player_id: '',
    player_name: '',
    team,
    hero_name: '',
    hero_role: 'mage',
    kills: 0,
    deaths: 0,
    assists: 0,
    damage: 0,
    damage_taken: 0,
    healing: 0
  })
}

// 删除玩家行
function removePlayerRow(index: number) {
  matchData.value.players.splice(index, 1)
}

// 获取玩家列表
async function loadPlayers() {
  loading.value = true
  try {
    const list = await playerApi.getList()
    players.value = list
  } catch (e) {
    console.error(e)
    // 如果获取失败，允许继续录入（可能是数据库未配置）
    players.value = []
  } finally {
    loading.value = false
  }
}

// 提交对局
async function submitMatch() {
  // 验证玩家名称不能为空
  const emptyNames = matchData.value.players.filter(p => !p.player_name.trim())
  if (emptyNames.length > 0) {
    message.value = '所有玩家名称不能为空'
    messageType.value = 'error'
    return
  }

  if (matchData.value.players.length < 2) {
    message.value = '至少需要2名玩家'
    messageType.value = 'error'
    return
  }

  const hasBlue = matchData.value.players.some(p => p.team === 'blue')
  const hasRed = matchData.value.players.some(p => p.team === 'red')
  if (!hasBlue || !hasRed) {
    message.value = '蓝方和红方都需要有玩家'
    messageType.value = 'error'
    return
  }

  const hasWinner = matchData.value.players.some(p => p.team === matchData.value.winner_team)
  if (!hasWinner) {
    message.value = '获胜队伍必须有玩家'
    messageType.value = 'error'
    return
  }

  submitting.value = true
  message.value = ''

  try {
    await adminApi.addMatch({
      game_time: new Date(matchData.value.game_time).toISOString(),
      duration: parseDuration(matchData.value.duration_minutes),
      winner_team: matchData.value.winner_team,
      players: matchData.value.players.map(p => ({
        player_name: p.player_name.trim(),
        team: p.team,
        hero_name: p.hero_name.trim(),
        hero_role: p.hero_role,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        damage: p.damage,
        damage_taken: p.damage_taken,
        healing: p.healing
      }))
    })
    message.value = '对局录入成功！'
    messageType.value = 'success'

    // 重置表单并刷新玩家列表
    matchData.value.players = []
    matchData.value.winner_team = 'blue'
    matchData.value.duration_minutes = '20:00'
    loadPlayers() // 刷新玩家列表（可能新增了玩家）
    addPlayerRow('blue')
    addPlayerRow('red')
  } catch (e: any) {
    console.error(e)
    message.value = e.response?.data?.error || e.message || '录入失败'
    messageType.value = 'error'
  } finally {
    submitting.value = false
  }
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  loadPlayers()
  addPlayerRow('blue')
  addPlayerRow('red')
})

const bluePlayers = computed(() => matchData.value.players.filter(p => p.team === 'blue'))
const redPlayers = computed(() => matchData.value.players.filter(p => p.team === 'red'))
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
    <div class="max-w-4xl mx-auto">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <span class="text-purple-400">📝</span> 录入对局
        </h1>
        <button @click="goHome" class="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">
          返回首页
        </button>
      </div>

      <!-- 提示消息 -->
      <div v-if="message" :class="[
        'mb-4 p-4 rounded-lg',
        messageType === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
      ]">
        {{ message }}
      </div>

      <!-- 对局基本信息 -->
      <div class="glass-card p-6 mb-6">
        <h2 class="text-lg font-semibold text-white mb-4">对局信息</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">游戏时间</label>
            <input type="datetime-local" v-model="matchData.game_time"
              class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-purple-500">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">游戏时长</label>
            <input type="text" v-model="matchData.duration_minutes" placeholder="例如: 16:17"
              class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-purple-500">
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">获胜队伍</label>
            <select v-model="matchData.winner_team"
              class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-purple-500">
              <option v-for="opt in TEAM_OPTIONS" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 玩家数据录入 -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- 蓝方 -->
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-blue-400">🔵 蓝方</h2>
            <button @click="addPlayerRow('blue')" class="px-3 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
              + 添加玩家
            </button>
          </div>

          <div v-for="(player, idx) in matchData.players.filter(p => p.team === 'blue')" :key="idx"
            class="mb-4 p-4 rounded-lg bg-slate-800/50 border border-blue-500/20">
            <div class="grid grid-cols-2 gap-3">
              <!-- 玩家名称（输入框+下拉建议） -->
              <div class="col-span-2">
                <label class="block text-xs text-gray-400 mb-1">玩家名称</label>
                <input
                  type="text"
                  v-model="player.player_name"
                  list="players-list"
                  placeholder="输入名称（可选择已有玩家）"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm focus:border-blue-400"
                />
                <datalist id="players-list">
                  <option v-for="p in players" :value="p.name" />
                </datalist>
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">英雄</label>
                <input type="text" v-model="player.hero_name" list="heroes-list" placeholder="选择或输入英雄名"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
                <datalist id="heroes-list">
                  <option v-for="h in heroNames" :value="h" />
                </datalist>
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">定位</label>
                <select v-model="player.hero_role"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
                  <option v-for="opt in HERO_ROLE_OPTIONS" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">击杀</label>
                <input type="number" v-model="player.kills" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">死亡</label>
                <input type="number" v-model="player.deaths" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">助攻</label>
                <input type="number" v-model="player.assists" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">输出伤害</label>
                <input type="number" v-model="player.damage" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">承受伤害</label>
                <input type="number" v-model="player.damage_taken" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">治疗量</label>
                <input type="number" v-model="player.healing" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>

              <div class="col-span-2">
                <button @click="removePlayerRow(matchData.players.indexOf(player))"
                  class="text-red-400 text-sm hover:text-red-300">
                  🗑 删除
                </button>
              </div>
            </div>
          </div>

          <div v-if="bluePlayers.length === 0" class="text-gray-500 text-center py-4">
            点击上方按钮添加蓝方玩家
          </div>
        </div>

        <!-- 红方 -->
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-red-400">🔴 红方</h2>
            <button @click="addPlayerRow('red')" class="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
              + 添加玩家
            </button>
          </div>

          <div v-for="(player, idx) in matchData.players.filter(p => p.team === 'red')" :key="idx"
            class="mb-4 p-4 rounded-lg bg-slate-800/50 border border-red-500/20">
            <div class="grid grid-cols-2 gap-3">
              <!-- 玩家名称（输入框+下拉建议） -->
              <div class="col-span-2">
                <label class="block text-xs text-gray-400 mb-1">玩家名称</label>
                <input
                  type="text"
                  v-model="player.player_name"
                  list="players-list"
                  placeholder="输入名称（可选择已有玩家）"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm focus:border-red-400"
                />
                <datalist id="players-list">
                  <option v-for="p in players" :value="p.name" />
                </datalist>
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">英雄</label>
                <input type="text" v-model="player.hero_name" list="heroes-list" placeholder="选择或输入英雄名"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
                <datalist id="heroes-list">
                  <option v-for="h in heroNames" :value="h" />
                </datalist>
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">定位</label>
                <select v-model="player.hero_role"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
                  <option v-for="opt in HERO_ROLE_OPTIONS" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1">击杀</label>
                <input type="number" v-model="player.kills" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">死亡</label>
                <input type="number" v-model="player.deaths" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">助攻</label>
                <input type="number" v-model="player.assists" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">输出伤害</label>
                <input type="number" v-model="player.damage" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">承受伤害</label>
                <input type="number" v-model="player.damage_taken" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">治疗量</label>
                <input type="number" v-model="player.healing" min="0"
                  class="w-full px-2 py-1.5 rounded bg-slate-700 border border-slate-500 text-white text-sm">
              </div>

              <div class="col-span-2">
                <button @click="removePlayerRow(matchData.players.indexOf(player))"
                  class="text-red-400 text-sm hover:text-red-300">
                  🗑 删除
                </button>
              </div>
            </div>
          </div>

          <div v-if="redPlayers.length === 0" class="text-gray-500 text-center py-4">
            点击上方按钮添加红方玩家
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="mt-6 flex justify-center">
        <button @click="submitMatch" :disabled="submitting"
          class="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {{ submitting ? '提交中...' : '✓ 提交对局' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-card {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
}
</style>