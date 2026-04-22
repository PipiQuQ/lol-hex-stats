<template>
  <div
    class="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-neon-blue/40 transition-all duration-300 group"
    @click="$emit('click', entry.player_id)"
  >
    <div class="flex-shrink-0 w-10 flex justify-center">
      <span
        v-if="entry.rank <= 3"
        class="text-2xl font-black"
        :class="rankIconColor"
      >
        {{ rankIcon }}
      </span>
      <span v-else class="text-lg font-bold text-gray-500">{{ entry.rank }}</span>
    </div>

    <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 flex items-center justify-center border border-neon-blue/20 overflow-hidden group-hover:scale-110 transition-transform">
      <img
        v-if="entry.avatar"
        :src="entry.avatar"
        :alt="entry.name"
        class="w-full h-full object-cover"
      />
      <span v-else class="text-sm font-bold text-neon-blue">
        {{ entry.name.charAt(0) }}
      </span>
    </div>

    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-white truncate group-hover:text-neon-blue transition-colors">
        {{ entry.name }}
      </h3>
      <p class="text-xs text-gray-400">{{ entry.total_matches }} 场</p>
    </div>

    <div class="hidden sm:flex items-center gap-3 text-sm">
      <div class="w-16">
        <div class="flex items-center justify-between mb-0.5">
          <span class="text-gray-400 text-xs">胜率</span>
          <span
            class="font-semibold"
            :class="entry.win_rate >= 0.5 ? 'text-neon-green' : 'text-red-400'"
          >
            {{ (entry.win_rate * 100).toFixed(0) }}%
          </span>
        </div>
        <div class="w-full h-1.5 bg-dark-elevated rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="entry.win_rate >= 0.5 ? 'bg-neon-green' : 'bg-red-400'"
            :style="{ width: `${entry.win_rate * 100}%` }"
          />
        </div>
      </div>

      <ScoreBadge :score="entry.composite_score" :total-matches="entry.total_matches" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RankingEntry } from '@/types/ranking'
import ScoreBadge from './ScoreBadge.vue'

const props = defineProps<{
  entry: RankingEntry
}>()

defineEmits<{
  click: [playerId: string]
}>()

const rankIcon = computed(() => {
  const icons = ['🥇', '🥈', '🥉']
  return icons[props.entry.rank - 1] || ''
})

const rankIconColor = computed(() => {
  const colors = ['text-yellow-400', 'text-gray-300', 'text-orange-400']
  return colors[props.entry.rank - 1] || ''
})
</script>
