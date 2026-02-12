# Supabase 로그인 및 권한 설정

대시보드는 **Supabase Auth**로 로그인하며, **권한이 부여된 이메일**만 접근할 수 있습니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 로그인 후 **New project** 생성
2. 프로젝트 설정 후 **Settings → API**에서 다음 값 확인:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 다음 내용을 넣습니다.

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

`.env.example`을 복사한 뒤 값을 채워도 됩니다.

## 3. 허용 이메일 테이블 생성

Supabase 대시보드 **SQL Editor**에서 아래 SQL을 실행하세요.

```sql
-- 권한이 부여된 이메일 목록
CREATE TABLE IF NOT EXISTS allowed_emails (
  email text PRIMARY KEY
);

-- RLS: 로그인한 사용자는 자신의 이메일이 목록에 있는지만 조회 가능
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own email row" ON allowed_emails;
CREATE POLICY "Users can read own email row"
ON allowed_emails FOR SELECT
TO authenticated
USING (email = (auth.jwt()->>'email'));

-- 관리자 이메일 추가 (실제 사용할 이메일로 변경)
INSERT INTO allowed_emails (email) VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;
```

`your-email@example.com`을 실제로 허용할 이메일로 바꾼 뒤 실행하세요.  
추가로 허용할 사용자가 있으면 같은 형식으로 `INSERT`를 더 실행하면 됩니다.

## 4. 인증 설정 (Supabase 대시보드)

- **Authentication → Providers**: **Email** 사용 설정
- **Authentication → Users**: 여기서 사용자를 직접 추가하거나, 앱에서 **회원가입**으로 가입한 뒤 `allowed_emails`에만 추가해도 됩니다.

원하면 **Authentication → Providers → Email**에서 **Confirm email**을 켜서 이메일 인증 후 로그인하도록 할 수 있습니다.

## 5. 동작 요약

- **로그인**: 이메일 + 비밀번호로 로그인 (Supabase Auth)
- **권한**: 로그인한 사용자의 이메일이 `allowed_emails` 테이블에 있을 때만 대시보드 접근 가능
- **회원가입**: 로그인 화면에서 “회원가입” 가능. 가입 후 관리자가 `allowed_emails`에 해당 이메일을 추가해야 접근 가능

새 사용자를 허용하려면 Supabase **SQL Editor**에서:

```sql
INSERT INTO allowed_emails (email) VALUES ('newuser@example.com')
ON CONFLICT (email) DO NOTHING;
```

---

## 6. 피평가자·평가 데이터 테이블 (데이터 추적/관리)

**SQL Editor**에서 아래를 실행해 피평가자(evaluatees)와 평가 기록(evaluations) 테이블을 만드세요.

```sql
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

ALTER TABLE evaluatees ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read evaluatees" ON evaluatees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert evaluatees" ON evaluatees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update evaluatees" ON evaluatees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete evaluatees" ON evaluatees FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated read evaluations" ON evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert evaluations" ON evaluations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update evaluations" ON evaluations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete evaluations" ON evaluations FOR DELETE TO authenticated USING (true);
```

이후 앱의 **데이터 관리** 탭에서 피평가자 추가·평가 입력·수정·삭제가 가능하며, **데모 데이터 불러오기**로 기존 데모 데이터를 한 번에 넣을 수 있습니다.
