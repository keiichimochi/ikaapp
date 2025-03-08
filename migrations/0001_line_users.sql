-- LINE BOT用のテーブル追加
CREATE TABLE IF NOT EXISTS line_users (
  id TEXT PRIMARY KEY,
  line_id TEXT UNIQUE NOT NULL,
  subscribe BOOLEAN DEFAULT true,
  delivery_time TEXT DEFAULT '08:00',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
); 