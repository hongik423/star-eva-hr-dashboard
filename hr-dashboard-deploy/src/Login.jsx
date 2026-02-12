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
    maxWidth: 400,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  title: { fontSize: 22, fontWeight: 800, color: '#F1F5F9', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 28 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 15,
    color: '#F1F5F9',
    marginBottom: 14,
    outline: 'none',
  },
  btn: (primary) => ({
    width: '100%',
    padding: '14px 20px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    background: primary ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : 'rgba(148, 163, 184, 0.2)',
    color: primary ? '#fff' : '#94A3B8',
    marginTop: 8,
  }),
  error: { fontSize: 13, color: '#F87171', marginTop: 12, textAlign: 'center' },
  link: { fontSize: 13, color: '#60A5FA', marginTop: 16, textAlign: 'center', cursor: 'pointer' },
};

export default function Login({ onSignIn, loading, error: externalError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email.trim()) {
      setLocalError('이메일을 입력하세요.');
      return;
    }
    if (!password) {
      setLocalError('비밀번호를 입력하세요.');
      return;
    }
    if (password.length < 6) {
      setLocalError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    await onSignIn({ email: email.trim(), password, isSignUp });
  };

  const err = externalError || localError;

  return (
    <div style={sty.page}>
      <div style={sty.card}>
        <h1 style={sty.title}>기업의별 HR 대시보드</h1>
        <p style={sty.subtitle}>
          {isSignUp ? '계정을 생성한 뒤 관리자가 권한을 부여하면 대시보드를 이용할 수 있습니다.' : '권한이 부여된 계정으로 로그인하세요.'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={sty.input}
            autoComplete="email"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={sty.input}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            disabled={loading}
          />
          <button type="submit" style={sty.btn(true)} disabled={loading}>
            {loading ? '처리 중…' : isSignUp ? '회원가입' : '로그인'}
          </button>
        </form>
        {err && <div style={sty.error}>{err}</div>}
        <div style={sty.link} onClick={() => { setIsSignUp(!isSignUp); setLocalError(''); }}>
          {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </div>
      </div>
    </div>
  );
}
