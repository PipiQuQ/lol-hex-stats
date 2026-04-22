<template>
  <div class="glass-card rounded-xl p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-white flex items-center gap-2">
        <LineChart class="w-4 h-4 text-neon-blue" />
        近期趋势
      </h3>
      <span class="text-xs text-gray-400">最近{{ data.length }}场</span>
    </div>
    <div ref="chartRef" class="w-full h-[220px]"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { LineChart } from 'lucide-vue-next'

const props = defineProps<{
  data: number[]
  labels?: string[]
}>()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: {
      top: 20,
      right: 15,
      bottom: 25,
      left: 40
    },
    xAxis: {
      type: 'category',
      data: props.labels || props.data.map((_, i) => `第${i + 1}场`),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: '#6B7280', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      axisLabel: { color: '#6B7280', fontSize: 10 }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: 'rgba(0, 217, 255, 0.2)',
      textStyle: { color: '#E8ECF0', fontSize: 12 },
      formatter: (params: any) => `${params[0].name}<br/>评分: ${params[0].value}`
    },
    series: [
      {
        type: 'line',
        data: props.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: {
          width: 2.5,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#00D9FF' },
            { offset: 1, color: '#7B68EE' }
          ])
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,217,255,0.25)' },
            { offset: 1, color: 'rgba(123,104,238,0.02)' }
          ])
        },
        itemStyle: {
          color: '#00D9FF',
          borderColor: '#0A0E17',
          borderWidth: 2
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(() => props.data, () => {
  if (chartInstance) {
    chartInstance.setOption({ series: [{ data: props.data }] })
  } else {
    initChart()
  }
}, { deep: true })
</script>
