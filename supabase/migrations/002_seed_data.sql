-- 测试数据插入 (可选)

-- 插入测试玩家
INSERT INTO players (name, game_id) VALUES
  ('小明', 'game001'),
  ('大壮', 'game002'),
  ('阿杰', 'game003'),
  ('老王', 'game004'),
  ('小美', 'game005'),
  ('阿飞', 'game006'),
  ('大熊', 'game007'),
  ('小李', 'game008')
ON CONFLICT (name) DO NOTHING;

-- 插入测试对局
INSERT INTO matches (game_time, duration, winner_team) VALUES
  (NOW() - INTERVAL '1 day', 1200, 'blue'),
  (NOW() - INTERVAL '2 days', 1500, 'red'),
  (NOW() - INTERVAL '3 days', 900, 'blue')
ON CONFLICT DO NOTHING;