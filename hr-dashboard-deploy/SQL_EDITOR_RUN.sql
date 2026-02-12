-- ============================================================
-- Supabase SQL Editor 에서 전체 선택 후 Run 실행
-- ============================================================

-- 1) 로그인 권한: 허용 이메일 테이블
CREATE TABLE IF NOT EXISTS allowed_emails (
  email text PRIMARY KEY
);

ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own email row" ON allowed_emails;
CREATE POLICY "Users can read own email row"
ON allowed_emails FOR SELECT TO authenticated
USING (email = (auth.jwt()->>'email'));

-- 아래 이메일을 본인 로그인 이메일로 바꾼 뒤 실행하세요.
INSERT INTO allowed_emails (email) VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;


-- 2) 피평가자 테이블
CREATE TABLE IF NOT EXISTS evaluatees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text DEFAULT '',
  position text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) 평가 기록 테이블
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluatee_id uuid NOT NULL REFERENCES evaluatees(id) ON DELETE CASCADE,
  period text NOT NULL,
  department text DEFAULT '',
  position text DEFAULT '',
  evaluator1 text DEFAULT '',
  evaluator2 text DEFAULT '',
  method text DEFAULT '',
  score numeric,
  grade text DEFAULT '',
  rank int,
  feedback1 text DEFAULT '',
  feedback2 text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(evaluatee_id, period)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_evaluatee_id ON evaluations(evaluatee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON evaluations(period);

ALTER TABLE evaluatees ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read evaluatees" ON evaluatees;
CREATE POLICY "Authenticated read evaluatees" ON evaluatees FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated insert evaluatees" ON evaluatees;
CREATE POLICY "Authenticated insert evaluatees" ON evaluatees FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated update evaluatees" ON evaluatees;
CREATE POLICY "Authenticated update evaluatees" ON evaluatees FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated delete evaluatees" ON evaluatees;
CREATE POLICY "Authenticated delete evaluatees" ON evaluatees FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read evaluations" ON evaluations;
CREATE POLICY "Authenticated read evaluations" ON evaluations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated insert evaluations" ON evaluations;
CREATE POLICY "Authenticated insert evaluations" ON evaluations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated update evaluations" ON evaluations;
CREATE POLICY "Authenticated update evaluations" ON evaluations FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated delete evaluations" ON evaluations;
CREATE POLICY "Authenticated delete evaluations" ON evaluations FOR DELETE TO authenticated USING (true);
