-- 配置 Row Level Security，允许前端直接操作
-- 注意：这种方式适合小型私有项目，公开项目需要更严格的权限控制

-- 启用 RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- players 表：所有人可读，所有人可插入（用于创建新玩家）
CREATE POLICY "players_read_all" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert_all" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update_all" ON players FOR UPDATE USING (true);

-- matches 表：所有人可读，所有人可插入
CREATE POLICY "matches_read_all" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert_all" ON matches FOR INSERT WITH CHECK (true);

-- match_players 表：所有人可读，所有人可插入
CREATE POLICY "match_players_read_all" ON match_players FOR SELECT USING (true);
CREATE POLICY "match_players_insert_all" ON match_players FOR INSERT WITH CHECK (true);