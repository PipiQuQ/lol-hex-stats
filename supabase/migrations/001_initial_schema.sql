-- LOL海克斯乱斗战绩统计系统数据库初始化

-- 玩家表
CREATE TABLE IF NOT EXISTS players (
  player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  avatar TEXT DEFAULT '',
  game_id TEXT,  -- 游戏内ID，用于API抓取
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 对局表
CREATE TABLE IF NOT EXISTS matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,  -- 游戏时长(秒)
  mode TEXT DEFAULT '海克斯乱斗',
  winner_team TEXT NOT NULL CHECK (winner_team IN ('blue', 'red')),
  source TEXT DEFAULT 'manual',  -- 数据来源: api/manual
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 对局玩家详情表
CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(match_id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('blue', 'red')),
  hero_id TEXT,
  hero_name TEXT NOT NULL,
  hero_role TEXT NOT NULL CHECK (hero_role IN ('tank', 'fighter', 'support', 'assassin', 'mage', 'marksman')),
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  damage INTEGER DEFAULT 0,
  damage_taken INTEGER DEFAULT 0,
  healing INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  UNIQUE(match_id, player_id)
);

-- 性能索引
CREATE INDEX IF NOT EXISTS idx_matches_game_time ON matches(game_time DESC);
CREATE INDEX IF NOT EXISTS idx_match_players_player ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

-- Row Level Security (可选，用于生产环境)
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;