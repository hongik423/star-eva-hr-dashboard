import { useState } from 'react';

const sty = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 45%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: 20,
    padding: 40,
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  title: { fontSize: 22, fontWeight: 800, color: '#F1F5F9', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 24 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 15,
    color: '#F1F5F9',
    marginBottom: 16,
    outline: 'none',
  },
  btn: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    color: '#fff',
  },
  error: { fontSize: 13, color: '#F87171', marginTop: 12, textAlign: 'center' },
};

const SIMPLE_AUTH_KEY = 'hr_dashboard_simple_auth';

export function getSimpleAuthSession() {
  try {
    return sessionStorage.getItem(SIMPLE_AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSimpleAuthSession() {
  try {
    sessionStorage.setItem(SIMPLE_AUTH_KEY, '1');
  } catch {}
}

export function clearSimpleAuthSession() {
  try {
    sessionStorage.removeItem(SIMPLE_AUTH_KEY);
  } catch {}
}

export default function SimpleLogin({ onSuccess, mode }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isNoPassword = mode === 'no-password';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNoPassword) return;
    setError('');
    const appPassword = import.meta.env.VITE_APP_PASSWORD || '';
    if (!appPassword) {
      setError('관리자에게 비밀번호 설정을 요청하세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력하세요.');
      return;
    }
    setLoading(true);
    if (password === appPassword) {
      setSimpleAuthSession();
      onSuccess();
    } else {
      setError('비밀번호가 올바르지 않습니다.');
      setLoading(false);
    }
  };

  return (
    <div style={sty.page}>
      <div style={sty.card}>
        <h1 style={sty.title}>기업의별 HR 대시보드</h1>
        <p style={sty.subtitle}>
          {isNoPassword
            ? '비밀번호가 설정되지 않았습니다. Vercel 프로젝트 설정 → Environment Variables에서 VITE_APP_PASSWORD를 추가한 뒤 재배포해 주세요.'
            : '비밀번호를 입력하면 대시보드를 조회할 수 있습니다.'}
        </p>
        {!isNoPassword && (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={sty.input}
              autoComplete="current-password"
              disabled={loading}
            />
            <button type="submit" style={sty.btn} disabled={loading}>
              {loading ? '확인 중…' : '로그인'}
            </button>
          </form>
        )}
        {error && <div style={sty.error}>{error}</div>}
      </div>
    </div>
  );
}
