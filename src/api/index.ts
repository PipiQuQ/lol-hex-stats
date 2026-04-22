import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.message)
    return Promise.reject(error)
  }
)

export default api

// 手动录入对局API（需要通过Vercel Functions）
export const adminApi = {
  addMatch: async (matchData: {
    game_time: string
    duration: number
    winner_team: 'blue' | 'red'
    players: Array<{
      player_name: string
      team: 'blue' | 'red'
      hero_name: string
      hero_role: 'tank' | 'fighter' | 'support' | 'assassin' | 'mage' | 'marksman'
      kills: number
      deaths: number
      assists: number
      damage: number
      damage_taken: number
      healing: number
    }>
  }) => {
    return api.post('/admin/add-match', matchData)
  }
}
