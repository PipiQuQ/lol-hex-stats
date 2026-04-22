<template>
  <div class="min-h-screen pb-20">
    <!-- 顶部导航 -->
    <header class="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5 rounded-none">
      <div class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20">
            <Sword class="w-4.5 h-4.5 text-white" />
          </div>
          <h1 class="text-base font-bold text-white tracking-wide">海克斯乱斗</h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToAdmin"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
          >
            <Plus class="w-3.5 h-3.5" />
            录入
          </button>
          <button
            @click="handleRefresh"
            :disabled="uiStore.isLoading"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            :class="
              uiStore.isLoading
                ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                : 'bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20'
            "
          >
            <RefreshCw :class="{ 'animate-spin': uiStore.isLoading }" class="w-3.5 h-3.5" />
            更新
          </button>
        </div>
      </div>
    </header>

    <main class="pt-16 max-w-lg mx-auto px-4 space-y-5">
      <!-- 每日最佳 -->
      <DailyBestCard
        v-if="dailyBest"
        :daily="dailyBest"
        @select-player="goToPlayerDetail"
      />

      <!-- 筛选器 -->
      <div class="flex items-center justify-between">
        <TimeFilter v-model="uiStore.timeRange" />
        <span v-if="uiStore.lastUpdated" class="text-[11px] text-gray-500 hidden sm:block">
          {{ formatLastUpdated }}
        </span>
      </div>

      <!-- 排行榜标题 -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 class="w-4.5 h-4.5 text-neon-blue" />
          战绩排行榜
        </h2>
        <span class="text-xs text-gray-400">{{ rankings.length }} 位玩家</span>
      </div>

      <!-- 排行榜列表 -->
      <div
        v-if="!uiStore.isLoading && rankings.length > 0"
        class="space-y-3"
      >
        <RankCard
          v-for="entry in rankings"
          :key="entry.player_id"
          :entry="entry"
          @click="goToPlayerDetail"
        />
      </div>

      <!-- 加载状态 -->
      <div v-if="uiStore.isLoading" class="py-12 flex flex-col items-center gap-3">
        <Loader2 class="w-8 h-8 text-neon-blue animate-spin" />
        <p class="text-sm text-gray-400">正在加载数据...</p>
      </div>

      <!-- 空状态 -->
      <div
        v-if="!uiStore.isLoading && rankings.length === 0"
        class="py-16 text-center space-y-3"
      >
        <Users class="w-12 h-12 text-gray-600 mx-auto" />
        <p class="text-sm text-gray-500">暂无数据，点击更新按钮获取最新战绩</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Sword, RefreshCw, BarChart3, Users, Loader2, Plus } from 'lucide-vue-next'
import { useUIStore } from '@/stores/uiStore'
import { rankingApi } from '@/api/ranking'
import type { RankingEntry, DailyBest } from '@/types/ranking'
import DailyBestCard from '@/components/DailyBestCard.vue'
import TimeFilter from '@/components/TimeFilter.vue'
import RankCard from '@/components/RankCard.vue'

const router = useRouter()
const uiStore = useUIStore()

const rankings = ref<RankingEntry[]>([])
const dailyBest = ref<DailyBest | null>(null)

const formatLastUpdated = computed(() => {
  if (!uiStore.lastUpdated) return ''
  const d = new Date(uiStore.lastUpdated)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} 更新`
})

async function fetchRankings() {
  uiStore.setLoading(true)
  try {
    const [rankingData, dailyData] = await Promise.all([
      rankingApi.getRankings(uiStore.timeRange),
      rankingApi.getDailyBest()
    ])
    rankings.value = rankingData as RankingEntry[]
    dailyBest.value = dailyData as DailyBest
    uiStore.setLastUpdated(new Date().toISOString())
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    uiStore.setLoading(false)
  }
}

async function handleRefresh() {
  await fetchRankings()
}

function goToPlayerDetail(playerId: string) {
  router.push({ name: 'player-detail', params: { id: playerId } })
}

function goToAdmin() {
  router.push({ name: 'admin-add-match' })
}

onMounted(() => {
  fetchRankings()
})
</script>
