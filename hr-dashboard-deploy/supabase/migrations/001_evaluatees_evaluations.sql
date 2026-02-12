-- 피평가자 (평가 대상 직원)
CREATE TABLE IF NOT EXISTS evaluatees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text DEFAULT '',
  position text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 평가 기록 (분기별)
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

-- RLS: allowed_emails 사용자만 접근 (인증된 사용자 전원 허용으로 단순화 후, 앱에서 allowed_emails 체크)
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
