import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // 由于未接入自动抓取API，刷新功能暂时返回提示
    res.status(200).json({
      success: true,
      message: '手动刷新已触发（自动抓取功能未启用，请使用/api/admin/add-match手动录入对局）',
      updated_at: new Date().toISOString(),
      auto_fetch_enabled: false
    })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}