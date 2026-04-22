-- 累计汇总字段添加到players表
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_kills INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_deaths INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_assists INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_damage INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_damage_taken INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_healing INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;

-- 创建函数：更新玩家累计统计
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新玩家的累计数据
  UPDATE players SET
    total_kills = total_kills + NEW.kills,
    total_deaths = total_deaths + NEW.deaths,
    total_assists = total_assists + NEW.assists,
    total_damage = total_damage + NEW.damage,
    total_damage_taken = total_damage_taken + NEW.damage_taken,
    total_healing = total_healing + NEW.healing,
    total_matches = total_matches + 1,
    total_wins = total_wins + CASE WHEN NEW.is_winner THEN 1 ELSE 0 END
  WHERE player_id = NEW.player_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：每次插入match_players时自动更新players累计统计
DROP TRIGGER IF EXISTS trigger_update_player_stats ON match_players;
CREATE TRIGGER trigger_update_player_stats
  AFTER INSERT ON match_players
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats();

-- 创建函数：删除对局时回退玩家累计统计
CREATE OR REPLACE FUNCTION revert_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 回退玩家的累计数据
  UPDATE players SET
    total_kills = total_kills - OLD.kills,
    total_deaths = total_deaths - OLD.deaths,
    total_assists = total_assists - OLD.assists,
    total_damage = total_damage - OLD.damage,
    total_damage_taken = total_damage_taken - OLD.damage_taken,
    total_healing = total_healing - OLD.healing,
    total_matches = total_matches - 1,
    total_wins = total_wins - CASE WHEN OLD.is_winner THEN 1 ELSE 0 END
  WHERE player_id = OLD.player_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：每次删除match_players时自动回退players累计统计
DROP TRIGGER IF EXISTS trigger_revert_player_stats ON match_players;
CREATE TRIGGER trigger_revert_player_stats
  AFTER DELETE ON match_players
  FOR EACH ROW
  EXECUTE FUNCTION revert_player_stats();