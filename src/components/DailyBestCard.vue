<template>
  <div class="glass-card rounded-2xl p-6 neon-border relative overflow-hidden" v-if="daily">
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-neon-blue/5 rounded-full blur-2xl"></div>
    <div class="absolute -bottom-8 -left-8 w-24 h-24 bg-neon-purple/5 rounded-full blur-xl"></div>

    <div class="relative flex items-center gap-4 mb-4">
      <div class="flex items-center gap-2 text-amber-400">
        <Trophy class="w-6 h-6" />
        <span class="font-bold">每日最佳</span>
      </div>
      <span class="text-sm text-gray-400">{{ dateLabel }}</span>
    </div>

    <div
      class="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
      @click="$emit('select-player', daily.player_id)"
    >
      <div class="relative w-16 h-16 flex-shrink-0">
        <div class="w-full h-full rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-600/20 flex items-center justify-center border-2 border-amber-400/40 overflow-hidden">
          <img
            v-if="daily.avatar"
            :src="daily.avatar"
            :alt="daily.name"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-xl font-black text-amber-300">{{ daily.name.charAt(0) }}</span>
        </div>
        <div class="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Crown class="w-4 h-4 text-dark-bg" />
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="text-xl font-bold text-white truncate">{{ daily.name }}</h3>
        <p class="text-sm text-gray-300 mt-0.5">
          场均评分
          <span class="text-amber-400 font-bold text-lg ml-1">{{ daily.daily_score }}</span>
        </p>
      </div>

      <div class="text-right hidden sm:block">
        <div class="inline-flex items-baseline gap-1">
          <span class="text-2xl font-black text-neon-green">{{ daily.wins_today }}</span>
          <span class="text-gray-500 font-medium">胜</span>
          <span class="mx-1.5 text-gray-600">|</span>
          <span class="text-lg text-red-400 font-bold">{{ daily.losses_today }}</span>
          <span class="text-gray-500 font-medium">负</span>
        </div>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 text-center">
      <div>
        <p class="text-xs text-gray-400">当日胜率</p>
        <p class="font-bold text-neon-green mt-0.5">{{ (daily.win_rate_today * 100).toFixed(0) }}%</p>
      </div>
      <div>
        <p class="text-xs text-gray-400">表现分</p>
        <p class="font-bold text-neon-blue mt-0.5">{{ daily.performance_score_today }}</p>
      </div>
      <div>
        <p class="text-xs text-gray-400">总场次</p>
        <p class="font-bold text-white mt-0.5">{{ daily.matches_today }}场</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Trophy, Crown } from 'lucide-vue-next'
import type { DailyBest } from '@/types/ranking'

const props = defineProps<{
  daily: DailyBest | null
}>()

defineEmits<{
  'select-player': [playerId: string]
}>()

const dateLabel = computed(() => {
  if (!props.daily) return ''
  const d = new Date(props.daily.date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})
</script>
