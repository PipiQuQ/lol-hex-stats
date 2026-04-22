import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TimeRange } from '@/types/ranking'

export const useUIStore = defineStore('ui', () => {
  const timeRange = ref<TimeRange>('all')
  const isLoading = ref(false)
  const lastUpdated = ref<string | null>(null)

  function setTimeRange(range: TimeRange) {
    timeRange.value = range
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setLastUpdated(time: string | null) {
    lastUpdated.value = time
  }

  return {
    timeRange,
    isLoading,
    lastUpdated,
    setTimeRange,
    setLoading,
    setLastUpdated
  }
})
