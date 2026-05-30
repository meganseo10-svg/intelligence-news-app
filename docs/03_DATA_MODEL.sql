-- ============================================================
-- 03. Data Model — Supabase Migration
-- ============================================================
-- 이 파일을 supabase/migrations/0001_init.sql에 그대로 복사하세요.
-- Supabase Dashboard > SQL Editor에서 직접 실행해도 됩니다.
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 1. USERS (Supabase auth.users가 이미 존재, 여기서는 프로필만)
-- ============================================================

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT,
  industry TEXT,
  company_size TEXT,
  products TEXT[] DEFAULT '{}',
  target_customers TEXT[] DEFAULT '{}',
  timezone TEXT DEFAULT 'Asia/Seoul',
  preferred_lang TEXT DEFAULT 'ko',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 회원가입 시 자동으로 user_profiles row 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. KEYWORD_GROUPS + KEYWORDS
-- ============================================================

CREATE TABLE keyword_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('competitor', 'industry', 'product', 'general')),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_keyword_groups_user ON keyword_groups(user_id);

CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES keyword_groups(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  sources JSONB DEFAULT '["naver", "gnews", "rss"]'::jsonb,
  language TEXT DEFAULT 'auto' CHECK (language IN ('ko', 'en', 'auto')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_keywords_group ON keywords(group_id);
CREATE INDEX idx_keywords_active ON keywords(is_active) WHERE is_active = TRUE;

-- ============================================================
-- 3. NEWS_CLUSTERS + NEWS_ITEMS
-- ============================================================

CREATE TABLE news_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_summary TEXT,
  representative_news_id UUID,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  news_count INTEGER DEFAULT 1
);

CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  url_canonical TEXT NOT NULL,
  publisher TEXT,
  publisher_domain TEXT,
  original_lang TEXT NOT NULL,
  title_original TEXT NOT NULL,
  body_original TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL CHECK (source IN ('naver', 'gnews', 'rss', 'manual')),
  cluster_id UUID REFERENCES news_clusters(id),
  embedding vector(1536),
  CONSTRAINT unique_canonical_url UNIQUE (url_canonical)
);

CREATE INDEX idx_news_published ON news_items(published_at DESC);
CREATE INDEX idx_news_cluster ON news_items(cluster_id);
CREATE INDEX idx_news_collected ON news_items(collected_at DESC);

-- pgvector IVFFlat 인덱스 (코사인 유사도)
CREATE INDEX idx_news_embedding ON news_items
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE news_clusters
  ADD CONSTRAINT fk_representative_news
  FOREIGN KEY (representative_news_id) REFERENCES news_items(id) ON DELETE SET NULL;

-- ============================================================
-- 4. TRANSLATIONS (글로벌 캐시, 전체 사용자 공유)
-- ============================================================

CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  target_lang TEXT NOT NULL,
  title_translated TEXT NOT NULL,
  summary_translated TEXT NOT NULL,
  body_translated TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_news_lang UNIQUE (news_id, target_lang)
);

CREATE INDEX idx_translations_news ON translations(news_id);

-- ============================================================
-- 5. INSIGHTS (사용자별 시사점)
-- ============================================================

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT,
  relevance_score FLOAT CHECK (relevance_score BETWEEN 0 AND 1),
  importance_score FLOAT CHECK (importance_score BETWEEN 0 AND 1),
  sales_opportunity TEXT,
  target_customer TEXT,
  risk_signal TEXT,
  tags TEXT[],
  recommended_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_news_user UNIQUE (news_id, user_id)
);

CREATE INDEX idx_insights_user_score ON insights(user_id, relevance_score DESC);
CREATE INDEX idx_insights_news ON insights(news_id);

-- ============================================================
-- 6. USER_NEWS_FEED (사용자별 일자별 피드 인덱스)
-- ============================================================

CREATE TABLE user_news_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_id UUID NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
  feed_date DATE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_news_date UNIQUE (user_id, news_id, feed_date)
);

CREATE INDEX idx_feed_user_date ON user_news_feed(user_id, feed_date DESC);
CREATE INDEX idx_feed_unread ON user_news_feed(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 7. SAVED_NEWS (북마크 + 메모)
-- ============================================================

CREATE TABLE saved_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  news_id UUID NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  user_note TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_saved UNIQUE (user_id, news_id)
);

CREATE INDEX idx_saved_user ON saved_news(user_id, saved_at DESC);

-- ============================================================
-- 8. NOTIFICATION_SETTINGS
-- ============================================================

CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'urgent_only')),
  send_time TIME NOT NULL DEFAULT '08:30:00',
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
  urgent_threshold FLOAT DEFAULT 0.8 CHECK (urgent_threshold BETWEEN 0 AND 1),
  auto_translate BOOLEAN DEFAULT TRUE,
  show_original_first BOOLEAN DEFAULT FALSE,
  group_clusters BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. DELIVERY_CHANNELS (사용자가 연결한 채널)
-- ============================================================

CREATE TABLE delivery_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'slack', 'discord', 'kakao')),
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_user_active ON delivery_channels(user_id, is_active);

-- ============================================================
-- 10. SHARED_LINKS (공개 공유 링크)
-- ============================================================

CREATE TABLE shared_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL CHECK (scope IN ('single_news', 'daily_digest')),
  resource_id UUID,
  resource_data JSONB,
  include_insights BOOLEAN DEFAULT TRUE,
  user_note TEXT,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shared_token ON shared_links(token);
CREATE INDEX idx_shared_user ON shared_links(user_id, created_at DESC);

-- ============================================================
-- 11. API_USAGE_LOG (운영 모니터링)
-- ============================================================

CREATE TABLE api_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_count INTEGER DEFAULT 1,
  token_input INTEGER,
  token_output INTEGER,
  cost_usd DECIMAL(10,6),
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_date ON api_usage_log(created_at DESC);
CREATE INDEX idx_usage_source_date ON api_usage_log(source, created_at DESC);

-- ============================================================
-- 12. Row Level Security (RLS) 정책
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_news_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- user_profiles: 본인만 SELECT/UPDATE
CREATE POLICY "users_select_own_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- keyword_groups: 본인만
CREATE POLICY "users_all_own_keyword_groups" ON keyword_groups
  FOR ALL USING (auth.uid() = user_id);

-- keywords: 그룹 소유자만
CREATE POLICY "users_all_own_keywords" ON keywords
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM keyword_groups
      WHERE keyword_groups.id = keywords.group_id
      AND keyword_groups.user_id = auth.uid()
    )
  );

-- insights: 본인만
CREATE POLICY "users_select_own_insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);

-- user_news_feed: 본인만
CREATE POLICY "users_all_own_feed" ON user_news_feed
  FOR ALL USING (auth.uid() = user_id);

-- saved_news: 본인만
CREATE POLICY "users_all_own_saved" ON saved_news
  FOR ALL USING (auth.uid() = user_id);

-- notification_settings: 본인만
CREATE POLICY "users_all_own_notification" ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- delivery_channels: 본인만
CREATE POLICY "users_all_own_channels" ON delivery_channels
  FOR ALL USING (auth.uid() = user_id);

-- shared_links: 본인이 만든 것만 관리 (열람은 token으로 별도 처리)
CREATE POLICY "users_manage_own_shared" ON shared_links
  FOR ALL USING (auth.uid() = user_id);

-- news_items, news_clusters, translations: 모두 SELECT 가능 (공유 자원)
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select_news" ON news_items
  FOR SELECT USING (TRUE);

ALTER TABLE news_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select_clusters" ON news_clusters
  FOR SELECT USING (TRUE);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_select_translations" ON translations
  FOR SELECT USING (TRUE);

-- ============================================================
-- 13. 헬퍼 함수
-- ============================================================

-- 의미 유사도 기반 dedup 함수
-- 새 뉴스 임베딩과 기존 뉴스의 유사도가 0.88 이상이면 같은 클러스터로 묶음
CREATE OR REPLACE FUNCTION find_similar_cluster(
  query_embedding vector(1536),
  similarity_threshold FLOAT DEFAULT 0.88
)
RETURNS UUID AS $$
DECLARE
  matched_cluster_id UUID;
BEGIN
  SELECT cluster_id INTO matched_cluster_id
  FROM news_items
  WHERE embedding IS NOT NULL
    AND cluster_id IS NOT NULL
    AND (1 - (embedding <=> query_embedding)) > similarity_threshold
  ORDER BY embedding <=> query_embedding ASC
  LIMIT 1;

  RETURN matched_cluster_id;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_notification_settings_updated
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 끝
-- ============================================================
