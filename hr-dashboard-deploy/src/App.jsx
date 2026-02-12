import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { fetchRawData, fetchEvaluatees } from './lib/evaluationApi';
import Login from './Login';
import SimpleLogin, { clearSimpleAuthSession } from './SimpleLogin';
import HRDashboard from './HRDashboard';
import { HRDASHBOARD_SEED_DATA } from './data/seedData';

const AUTH_LOADING = 'loading';
const AUTH_LOGGED_OUT = 'logged_out';
const AUTH_UNAUTHORIZED = 'unauthorized';
const AUTH_LOGGED_IN = 'logged_in';

const hasSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url.startsWith('https://'));
};

const hasSimplePasswordConfig = () => {
  try {
    return !!(import.meta.env.VITE_APP_PASSWORD ?? '');
  } catch {
    return false;
  }
};

// Supabase 없으면 무조건 비밀번호 게이트, Supabase 있어도 VITE_APP_PASSWORD 있으면 비밀번호 우선
const usePasswordGate = () => !hasSupabaseConfig() || hasSimplePasswordConfig();

export default function App() {
  const [simpleAuth] = useState(() => usePasswordGate());
  const [authState, setAuthState] = useState(() => {
    if (usePasswordGate()) return AUTH_LOGGED_OUT;
    if (hasSupabaseConfig()) return AUTH_LOADING;
    return AUTH_LOGGED_OUT;
  });
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');

  const checkAllowedEmail = async (email) => {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    if (error) return false;
    return !!data;
  };

  useEffect(() => {
    if (!hasSupabaseConfig() || simpleAuth) return;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthState(AUTH_LOGGED_OUT);
        return;
      }
      setUser(session.user);
      const allowed = await checkAllowedEmail(session.user.email);
      setAuthState(allowed ? AUTH_LOGGED_IN : AUTH_UNAUTHORIZED);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthState(AUTH_LOGGED_OUT);
        setAuthError('');
        return;
      }
      if (!session) {
        setAuthState(AUTH_LOGGED_OUT);
        return;
      }
      setUser(session.user);
      const allowed = await checkAllowedEmail(session.user.email);
      setAuthState(allowed ? AUTH_LOGGED_IN : AUTH_UNAUTHORIZED);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async ({ email, password, isSignUp }) => {
    setAuthError('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthError('가입 완료. 관리자가 권한을 부여할 때까지 대기해 주세요.');
        await supabase.auth.signOut();
        setAuthState(AUTH_LOGGED_OUT);
        setUser(null);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const allowed = await checkAllowedEmail(session.user.email);
      if (!allowed) {
        await supabase.auth.signOut();
        setAuthState(AUTH_UNAUTHORIZED);
        setAuthError('이 대시보드에 대한 접근 권한이 없습니다. 관리자에게 문의하세요.');
        return;
      }
      setAuthState(AUTH_LOGGED_IN);
      setUser(session.user);
    } catch (e) {
      setAuthError(e.message || '로그인에 실패했습니다.');
    }
  };

  const handleLogout = useCallback(async () => {
    if (simpleAuth) {
      clearSimpleAuthSession();
      setAuthState(AUTH_LOGGED_OUT);
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  }, [simpleAuth]);

  const [rawData, setRawData] = useState([]);
  const [evaluatees, setEvaluatees] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  const refetchData = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      const [data, ees] = await Promise.all([fetchRawData(), fetchEvaluatees()]);
      setRawData(data);
      setEvaluatees(ees || []);
    } catch (e) {
      setDataError(e.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState === AUTH_LOGGED_IN && !simpleAuth) refetchData();
  }, [authState, simpleAuth, refetchData]);

  if (authState === AUTH_LOADING) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8',
        fontSize: 15,
      }}>
        로딩 중…
      </div>
    );
  }

  if (authState === AUTH_UNAUTHORIZED) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 20,
          padding: 40,
          maxWidth: 400,
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 18, color: '#F1F5F9', marginBottom: 12 }}>접근 권한이 없습니다</h2>
          <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>
            이 대시보드를 볼 수 있는 권한이 부여되지 않았습니다. 관리자에게 문의하세요.
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'rgba(148, 163, 184, 0.2)',
              color: '#94A3B8',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  if (simpleAuth && authState === AUTH_LOGGED_OUT) {
    return (
      <SimpleLogin
        onSuccess={() => setAuthState(AUTH_LOGGED_IN)}
        mode={hasSimplePasswordConfig() ? undefined : 'no-password'}
      />
    );
  }

  if (!simpleAuth && authState === AUTH_LOGGED_OUT) {
    return (
      <Login
        onSignIn={handleSignIn}
        loading={false}
        error={authError}
      />
    );
  }

  if (simpleAuth && authState === AUTH_LOGGED_IN) {
    return (
      <HRDashboard
        rawData={HRDASHBOARD_SEED_DATA}
        loading={false}
        dataError=""
        evaluatees={[]}
        onRefresh={() => {}}
        onLogout={handleLogout}
        userEmail={null}
      />
    );
  }

  return (
    <HRDashboard
      rawData={rawData}
      loading={dataLoading}
      dataError={dataError}
      evaluatees={evaluatees}
      onRefresh={refetchData}
      onLogout={handleLogout}
      userEmail={user?.email}
    />
  );
}
