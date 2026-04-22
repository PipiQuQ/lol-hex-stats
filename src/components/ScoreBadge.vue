<template>
  <div
    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold transition-all duration-300"
    :class="badgeClass"
  >
    <Star v-if="!insufficient" class="w-3.5 h-3.5" />
    <span>{{ score }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { getScoreLabel } from '@/utils/formatters'
import { isScoreReliable, MIN_MATCHES_THRESHOLD } from '@/utils/scoring'

const props = defineProps<{
  score: number
  totalMatches?: number
}>()

const insufficient = computed(() =>
  props.totalMatches !== undefined && !isScoreReliable(props.totalMatches)
)

const badgeClass = computed(() => {
  if (insufficient.value) {
    return 'bg-gray-700/50 text-gray-500'
  }

  const label = getScoreLabel(props.score)

  switch (label.label) {
    case '超凡':
      return 'bg-yellow-500/20 text-yellow-400'
    case '优秀':
      return 'bg-green-500/20 text-neon-green'
    case '良好':
      return 'bg-cyan-500/20 text-neon-blue'
    case '及格':
      return 'bg-orange-500/20 text-amber-400'
    default:
      return 'bg-red-500/20 text-red-400'
  }
})
</script>
