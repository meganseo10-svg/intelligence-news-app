-- 시사점 생성 기준이 되는 프로필 항목 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trend_focus TEXT;      -- 주목 트렌드·방향
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS strengths TEXT;        -- 회사 강점
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weaknesses TEXT;       -- 회사 약점
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sales_focus TEXT;      -- 영업 기회 관점
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS threats TEXT;          -- 위협 요인
