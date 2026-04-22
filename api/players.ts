import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, isSupabaseConnected } from './lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConnected()) {
    return res.status(503).json({ error: '数据库未连接，请配置Supabase环境变量' })
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase!
        .from('players')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      res.status(200).json(data || [])
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: '获取玩家列表失败' })
    }
  } else if (req.method === 'POST') {
    const { name, game_id, avatar } = req.body || {}

    if (!name) {
      return res.status(400).json({ error: '玩家名称必填' })
    }

    try {
      const { data, error } = await supabase!
        .from('players')
        .insert({ name, avatar: avatar || '', game_id: game_id || null })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: '玩家名称已存在' })
        }
        throw error
      }
      res.status(201).json(data)
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: '创建玩家失败' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}