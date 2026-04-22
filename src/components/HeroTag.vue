<template>
  <div
    class="flex-shrink-0 px-3 py-2 rounded-lg bg-dark-elevated border border-white/5 hover:border-neon-blue/30 transition-all cursor-default group"
  >
    <div class="text-sm font-semibold text-white group-hover:text-neon-blue transition-colors">
      {{ heroName }}
    </div>
    <div
      class="text-xs font-medium mt-0.5"
      :class="winRate >= 0.6 ? 'text-neon-green' : winRate >= 0.4 ? 'text-gray-400' : 'text-red-400'"
    >
      胜率 {{ (winRate * 100).toFixed(0) }}%
    </div>
    <div class="w-full h-1 bg-dark-bg rounded-full mt-1.5 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="winRate >= 0.6 ? 'bg-neon-green' : winRate >= 0.4 ? 'bg-gray-500' : 'bg-red-400'"
        :style="{ width: `${winRate * 100}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  heroName: string
  winRate: number
  matches?: number
}>()
</script>
