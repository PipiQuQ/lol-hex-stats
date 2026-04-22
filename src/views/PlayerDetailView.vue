<template>
  <div class="min-h-screen pb-20">
    <!-- 顶部导航 -->
    <header class="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5 rounded-none">
      <div class="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
        <button
          @click="router.back()"
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft class="w-5 h-5 text-gray-300" />
        </button>
        <h1 class="text-base font-bold text-white">玩家详情</h1>
      </div>
    </header>

    <main v-if="!loading" class="pt-16 max-w-lg mx-auto px-4 space-y-5">
      <!-- 玩家头部信息区 -->
      <section class="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 rounded-full blur-2xl"></div>

        <div class="relative flex items-center gap-5">
          <div class="relative">
            <div
              class="w-20 h-20 rounded-full p-0.5"
              :class="scoreGlowClass"
            >
              <div class="w-full h-full rounded-full bg-dark-elevated flex items-center justify-center overflow-hidden border border-white/10">
                <img
                  v-if="player?.avatar"
                  :src="player.avatar"
                  :alt="player.name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-2xl font-black text-neon-blue">{{ player?.name.charAt(0) }}</span>
              </div>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="text-2xl font-black text-white truncate">{{ player?.name || '未知玩家' }}</h2>
            <p class="text-sm text-gray-400 mt-0.5">综合评分</p>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-4xl font-black" :class="scoreColorClass">{{ player?.composite_score || '--' }}</span>
              <ScoreBadge :score="player?.composite_score || 0" :total-matches="player?.total_matches" />
            </div>
          </div>
        </div>
      </section>

      <!-- 基础统计网格 -->
      <section class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="总场次" :value="player?.total_matches || 0" icon="Target" color="blue" suffix="场" />
        <StatCard
          label="胜率"
          :value="(player?.win_rate || 0) * 100"
          icon="TrendingUp"
          :color="(player?.win_rate || 0) >= 0.5 ? 'green' : 'red'"
          suffix="%"
          :sub-text="`${player?.wins || 0}胜 ${player?.losses || 0}负`"
        />
        <StatCard label="场次" :value="player?.total_matches || 0" icon="Gamepad2" color="amber" suffix="局" />
        <StatCard label="场均评分" :value="Math.round(player?.performance_score || 0)" icon="Activity" color="purple" />
      </section>

      <!-- 常用英雄TOP5 -->
      <section class="glass-card rounded-xl p-5">
        <h3 class="font-semibold text-white mb-4 flex items-center gap-2">
          <Sword class="w-4 h-4 text-neon-green" />
          常用英雄 TOP5
        </h3>
        <div v-if="heroStats && heroStats.length > 0" class="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          <HeroTag
            v-for="hero in heroStats.slice(0, 5)"
            :key="hero.hero_id"
            :hero-name="hero.hero_name"
            :win-rate="hero.win_rate"
            :matches="hero.matches"
          />
        </div>
        <p v-else class="text-sm text-gray-500 py-4 text-center">暂无英雄数据</p>
      </section>

      <!-- 详细表现数据 -->
      <section class="glass-card rounded-xl p-5 space-y-4">
        <h3 class="font-semibold text-white flex items-center gap-2">
          <BarChart3 class="w-4 h-4 text-neon-purple" />
          表现数据
        </h3>

        <DetailRow
          label="场均KDA"
          :value="`${formatKDA(player?.avg_kills || 0, player?.avg_deaths || 0, player?.avg_assists || 0)}`"
          :sub-value="`${(player?.avg_kills || 0).toFixed(1)} / ${(player?.avg_deaths || 0).toFixed(1)} / ${(player?.avg_assists || 0).toFixed(1)}`"
          icon="Swords"
          color="blue"
        />

        <DetailRow
          label="场均伤害"
          :value="formatNumber(player?.avg_damage || 0)"
          icon="Zap"
          color="red"
        />

        <DetailRow
          label="场均承伤"
          :value="formatNumber(player?.avg_damage_taken || 0)"
          icon="Shield"
          color="purple"
        />

        <DetailRow
          label="场均治疗"
          :value="formatNumber(player?.avg_healing || 0)"
          icon="HeartPulse"
          color="green"
        />
      </section>
    </main>

    <!-- 加载状态 -->
    <div v-if="loading" class="pt-20 max-w-lg mx-auto px-4 flex flex-col items-center justify-center gap-4 h-[60vh]">
      <Loader2 class="w-8 h-8 text-neon-blue animate-spin" />
      <p class="text-sm text-gray-400">加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft, Sword, BarChart3, Zap,
  Shield, HeartPulse, Coins, Loader2, Swords
} from 'lucide-vue-next'
import { playerApi } from '@/api/player'
import type { PlayerStats, HeroStat } from '@/types/player'
import { formatKDA, formatNumber, getScoreLabel } from '@/utils/formatters'
import StatCard from '@/components/StatCard.vue'
import HeroTag from '@/components/HeroTag.vue'
import ScoreBadge from '@/components/ScoreBadge.vue'

// 简单的详情行组件（内联避免额外文件）
const DetailRow = {
  props: {
    label: String,
    value: [String, Number],
    subValue: String,
    icon: String,
    color: { type: String, default: 'blue' }
  },
  template: `
    <div class="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
      <div class="flex items-center gap-2.5 text-sm text-gray-400">
        <component :is="iconComponent" class="w-4 h-4" :class="colorClass" />
        {{ label }}
      </div>
      <div class="text-right">
        <span class="font-semibold text-white">{{ value }}</span>
        <span v-if="subValue" class="block text-xs text-gray-500 mt-0.5">{{ subValue }}</span>
      </div>
    </div>`,
  setup(props: any) {
    const icons: Record<string, any> = { Swords, Zap, Shield, HeartPulse, Coins }
    const colors: Record<string, string> = {
      blue: 'text-neon-blue', red: 'text-red-400', purple: 'text-neon-purple',
      green: 'text-neon-green', amber: 'text-amber-400'
    }
    return {
      iconComponent: computed(() => icons[props.icon] || Swords),
      colorClass: computed(() => colors[props.color] || colors.blue)
    }
  },
  components: { Swords, Zap, Shield, HeartPulse, Coins }
}

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const player = ref<PlayerStats | null>(null)
const heroStats = ref<HeroStat[]>([])

const scoreLabel = computed(() => getScoreLabel(player.value?.composite_score || 0))

const scoreColorClass = computed(() => {
  const c = scoreLabel.value.color
  if (c === '#FFD700') return 'text-yellow-400'
  if (c === '#00FF88') return 'text-neon-green'
  if (c === '#00D9FF') return 'text-neon-blue'
  if (c === '#F59E0B') return 'text-amber-400'
  return 'text-red-400'
})

const scoreGlowClass = computed(() => {
  const s = player.value?.composite_score || 0
  if (s >= 90) return 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-dark-bg'
  if (s >= 80) return 'ring-2 ring-neon-green/50 ring-offset-2 ring-offset-dark-bg'
  if (s >= 70) return 'ring-2 ring-neon-blue/50 ring-offset-2 ring-offset-dark-bg'
  return ''
})

async function fetchPlayerDetail() {
  loading.value = true
  try {
    const data = await playerApi.getDetail(route.params.id as string)
    player.value = data as PlayerStats
    heroStats.value = (data as any).hero_stats || []
  } catch (error) {
    console.error('Failed to fetch player detail:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPlayerDetail()
})
</script>
