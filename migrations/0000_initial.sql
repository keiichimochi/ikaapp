-- 日記テーブル
CREATE TABLE IF NOT EXISTS diaries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ニュースソーステーブル
CREATE TABLE IF NOT EXISTS news_sources (
  id TEXT PRIMARY KEY,
  diary_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  FOREIGN KEY (diary_id) REFERENCES diaries(id)
);

-- キーワードテーブル
CREATE TABLE IF NOT EXISTS keywords (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL UNIQUE
);

-- 日記とキーワードの中間テーブル
CREATE TABLE IF NOT EXISTS diary_keywords (
  diary_id TEXT NOT NULL,
  keyword_id TEXT NOT NULL,
  FOREIGN KEY (diary_id) REFERENCES diaries(id),
  FOREIGN KEY (keyword_id) REFERENCES keywords(id),
  PRIMARY KEY (diary_id, keyword_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_diaries_date ON diaries(date);
CREATE INDEX IF NOT EXISTS idx_news_sources_diary_id ON news_sources(diary_id);
CREATE INDEX IF NOT EXISTS idx_keywords_word ON keywords(word);
CREATE INDEX IF NOT EXISTS idx_diary_keywords_keyword_id ON diary_keywords(keyword_id); 