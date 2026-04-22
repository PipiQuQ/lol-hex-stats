<template>
  <div class="flex items-center gap-1 p-1 bg-dark-card rounded-lg border border-white/5">
    <button
      v-for="option in options"
      :key="option.value"
      class="relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-out"
      :class="
        modelValue === option.value
          ? 'bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white shadow-lg'
          : 'text-gray-400 hover:text-gray-200'
      "
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TimeRange } from '@/types/ranking'

defineProps<{
  modelValue: TimeRange
}>()

defineEmits<{
  'update:modelValue': [value: TimeRange]
}>()

const options = [
  { label: '最近7天', value: '7d' as TimeRange },
  { label: '30天', value: '30d' as TimeRange },
  { label: '全部', value: 'all' as TimeRange }
]
</script>
