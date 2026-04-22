<template>
  <div class="glass-card rounded-xl p-4 stat-grid-item">
    <div class="flex items-center gap-2 mb-2" :class="iconColorClass">
      <component :is="iconComponent" class="w-4 h-4" />
      <span class="text-xs font-medium opacity-80">{{ label }}</span>
    </div>
    <div :class="valueColorClass">
      <span class="text-2xl font-bold tracking-tight">{{ displayValue }}</span>
      <span v-if="suffix" class="text-sm ml-0.5">{{ suffix }}</span>
    </div>
    <p v-if="subText" class="text-xs text-gray-500 mt-1">{{ subText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Target, TrendingUp, Award, Activity,
  Swords, Shield, HeartPulse, Coins
} from 'lucide-vue-next'

const props = defineProps<{
  label: string
  value: number | string
  suffix?: string
  subText?: string
  icon: string
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red'
}>()

const iconComponent = computed(() => {
  const icons: Record<string, any> = {
    Target, TrendingUp, Award, Activity,
    Swords, Shield, HeartPulse, Coins
  }
  return icons[props.icon] || Target
})

const colorMap = {
  blue: { icon: 'text-neon-blue', value: 'text-neon-blue' },
  green: { icon: 'text-neon-green', value: 'text-neon-green' },
  purple: { icon: 'text-neon-purple', value: 'text-neon-purple' },
  amber: { icon: 'text-amber-400', value: 'text-amber-400' },
  red: { icon: 'text-red-400', value: 'text-red-400' }
}

const defaultColors = colorMap.blue

const iconColorClass = computed(() => colorMap[props.color || 'blue']?.icon || defaultColors.icon)
const valueColorClass = computed(() => colorMap[props.color || 'blue']?.value || defaultColors.value)
const displayValue = computed(() => typeof props.value === 'number' ? props.value.toLocaleString() : props.value)
</script>
