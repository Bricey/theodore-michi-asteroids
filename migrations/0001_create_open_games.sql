-- Matchmaking: open games waiting for a player to join
CREATE TABLE IF NOT EXISTS open_games (
  peer_id TEXT PRIMARY KEY,
  game_mode TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
