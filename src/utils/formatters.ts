export function formatKDA(kills: number, deaths: number, assists: number): string {
  if (deaths === 0) {
    return '完美'
  }
  const kda = ((kills + assists) / deaths).toFixed(1)
  return kda
}

export function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: '超凡', color: '#FFD700' }
  if (score >= 80) return { label: '优秀', color: '#00FF88' }
  if (score >= 70) return { label: '良好', color: '#00D9FF' }
  if (score >= 60) return { label: '及格', color: '#F59E0B' }
  return { label: '待提升', color: '#EF4444' }
}
