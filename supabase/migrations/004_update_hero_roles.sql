-- 更新hero_role约束，支持6个官方定位
ALTER TABLE match_players DROP CONSTRAINT IF EXISTS match_players_hero_role_check;
ALTER TABLE match_players ADD CONSTRAINT match_players_hero_role_check
  CHECK (hero_role IN ('tank', 'fighter', 'support', 'assassin', 'mage', 'marksman'));