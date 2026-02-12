import { useState, useEffect, useRef } from 'react';
import {
  fetchEvaluationsByEvaluatee,
  addEvaluatee,
  updateEvaluatee,
  deleteEvaluatee,
  addEvaluation,
  updateEvaluation,
  deleteEvaluation,
  seedFromRawData,
} from './lib/evaluationApi';
import { parseExcelFile, importParsedRows } from './lib/excelImport';
import { HRDASHBOARD_SEED_DATA } from './data/seedData';

const PERIODS = ['2024-09-30', '2024-12-31', '2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31'];
const PERIOD_LABELS = { '2024-09-30': '24Q3', '2024-12-31': '24Q4', '2025-03-31': '25Q1', '2025-06-30': '25Q2', '2025-09-30': '25Q3', '2025-12-31': '25Q4' };
const GRADE_COLORS = { A: '#10B981', B: '#3B82F6', C: '#F59E0B', D: '#EF4444' };

const sty = {
  card: { background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 16, padding: 20, marginBottom: 16 },
  input: { width: '100%', boxSizing: 'border-box', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#F1F5F9', marginBottom: 10 },
  btn: (primary) => ({ padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: primary ? '#3B82F6' : 'rgba(148,163,184,0.2)', color: primary ? '#fff' : '#94A3B8' }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(148,163,184,0.2)', color: '#94A3B8', fontWeight: 600 },
  td: { padding: '10px 12px', borderBottom: '1px solid rgba(148,163,184,0.1)', color: '#E2E8F0' },
};

export default function DataManage({ evaluatees, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const [evals, setEvals] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddEe, setShowAddEe] = useState(false);
  const [showAddEv, setShowAddEv] = useState(null);
  const [editEv, setEditEv] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [formEe, setFormEe] = useState({ name: '', department: '', position: '' });
  const [formEv, setFormEv] = useState({ period: '2025-12-31', department: '', position: '', evaluator1: '', evaluator2: '', method: '절대평가', score: '', grade: '', rank: '', feedback1: '', feedback2: '' });

  const loadEvals = async (id) => {
    setLoading(true);
    try {
      const list = await fetchEvaluationsByEvaluatee(id);
      setEvals((prev) => ({ ...prev, [id]: list }));
    } catch (e) {
      setMessage(e.message || '평가 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expandedId) loadEvals(expandedId);
  }, [expandedId]);

  const handleAddEe = async (e) => {
    e.preventDefault();
    if (!formEe.name.trim()) return;
    setMessage('');
    try {
      await addEvaluatee(formEe);
      setFormEe({ name: '', department: '', position: '' });
      setShowAddEe(false);
      onRefresh();
    } catch (err) {
      setMessage(err.message || '추가 실패');
    }
  };

  const handleAddEv = async (e) => {
    e.preventDefault();
    if (!showAddEv) return;
    setMessage('');
    try {
      await addEvaluation(showAddEv, formEv);
      setFormEv({ period: '2025-12-31', department: '', position: '', evaluator1: '', evaluator2: '', method: '절대평가', score: '', grade: '', rank: '', feedback1: '', feedback2: '' });
      setShowAddEv(null);
      loadEvals(showAddEv);
      onRefresh();
    } catch (err) {
      setMessage(err.message || '평가 추가 실패');
    }
  };

  const handleUpdateEv = async (e) => {
    e.preventDefault();
    if (!editEv) return;
    const evaluateeId = editEv.evaluatee_id;
    setMessage('');
    try {
      await updateEvaluation(editEv.id, formEv);
      setEditEv(null);
      loadEvals(evaluateeId);
      onRefresh();
    } catch (err) {
      setMessage(err.message || '수정 실패');
    }
  };

  const handleDeleteEe = async (id, name) => {
    if (!confirm(`"${name}" 피평가자와 관련 평가를 모두 삭제할까요?`)) return;
    setMessage('');
    try {
      await deleteEvaluatee(id);
      setExpandedId((prev) => (prev === id ? null : prev));
      onRefresh();
    } catch (err) {
      setMessage(err.message || '삭제 실패');
    }
  };

  const handleDeleteEv = async (id, evaluateeId) => {
    if (!confirm('이 평가 기록을 삭제할까요?')) return;
    setMessage('');
    try {
      await deleteEvaluation(id);
      loadEvals(evaluateeId);
      onRefresh();
    } catch (err) {
      setMessage(err.message || '삭제 실패');
    }
  };

  const fileInputRef = useRef(null);

  const handleSeedFromCodebase = async () => {
    if (!confirm(`HRDashboard.jsx에 정의된 ${HRDASHBOARD_SEED_DATA.length}건을 Supabase에 입력합니다. 동일 피평가자·분기는 덮어씁니다. 계속할까요?`)) return;
    setMessage('');
    setSeedLoading(true);
    try {
      await seedFromRawData(HRDASHBOARD_SEED_DATA);
      onRefresh();
      setMessage(`코드베이스 데이터 일괄 입력 완료: ${HRDASHBOARD_SEED_DATA.length}건 반영되었습니다.`);
    } catch (err) {
      setMessage(err.message || '일괄 입력 실패');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleExcelImport = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setMessage('');
    setImportLoading(true);
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        setMessage('파싱된 데이터가 없습니다. 첫 행에 헤더(이름, 부서, 분기 등)가 있는지 확인하세요.');
        e.target.value = '';
        return;
      }
      if (!confirm(`총 ${rows.length}건을 불러옵니다. 동일 피평가자·분기 데이터는 덮어씁니다. 계속할까요?`)) {
        e.target.value = '';
        return;
      }
      await importParsedRows(rows);
      onRefresh();
      setMessage(`엑셀 불러오기 완료: ${rows.length}건 반영되었습니다.`);
    } catch (err) {
      setMessage(err.message || '엑셀 불러오기 실패');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const openEditEv = (ev) => {
    setEditEv(ev);
    setFormEv({
      period: ev.period,
      department: ev.department || '',
      position: ev.position || '',
      evaluator1: ev.evaluator1 || '',
      evaluator2: ev.evaluator2 || '',
      method: ev.method || '절대평가',
      score: ev.score ?? '',
      grade: ev.grade || '',
      rank: ev.rank ?? '',
      feedback1: ev.feedback1 || '',
      feedback2: ev.feedback2 || '',
    });
  };

  return (
    <div>
      {message && (
        <div style={{
          marginBottom: 16, padding: 12, borderRadius: 10, fontSize: 14,
          background: message.includes('완료') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: message.includes('완료') ? '#6EE7B7' : '#FCA5A5',
        }}>{message}</div>
      )}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={sty.btn(true)} onClick={() => setShowAddEe(true)}>+ 피평가자 추가</button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelImport} />
        <button style={sty.btn(false)} onClick={() => fileInputRef.current?.click()} disabled={importLoading}>
          {importLoading ? '불러오는 중…' : '📂 엑셀 불러오기'}
        </button>
        <button style={sty.btn(false)} onClick={handleSeedFromCodebase} disabled={seedLoading}>
          {seedLoading ? '입력 중…' : '📋 코드베이스 데이터 일괄 입력'}
        </button>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>· 첫 시트, 첫 행은 헤더(이름·부서·분기·점수·등급 등)</span>
      </div>

      {showAddEe && (
        <div style={sty.card}>
          <h3 style={{ fontSize: 16, color: '#F1F5F9', marginBottom: 16 }}>피평가자 추가</h3>
          <form onSubmit={handleAddEe}>
            <input style={sty.input} placeholder="이름 *" value={formEe.name} onChange={(e) => setFormEe((p) => ({ ...p, name: e.target.value }))} />
            <input style={sty.input} placeholder="부서" value={formEe.department} onChange={(e) => setFormEe((p) => ({ ...p, department: e.target.value }))} />
            <input style={sty.input} placeholder="직급" value={formEe.position} onChange={(e) => setFormEe((p) => ({ ...p, position: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" style={sty.btn(true)}>추가</button>
              <button type="button" style={sty.btn(false)} onClick={() => setShowAddEe(false)}>취소</button>
            </div>
          </form>
        </div>
      )}

      <div style={sty.card}>
        <h3 style={{ fontSize: 16, color: '#F1F5F9', marginBottom: 16 }}>피평가자 목록 ({evaluatees.length}명)</h3>
        {evaluatees.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: 14 }}>등록된 피평가자가 없습니다. 엑셀을 불러오거나 위에서 피평가자를 추가하세요.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {evaluatees.map((ee) => (
              <div key={ee.id} style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 12, padding: 14, border: '1px solid rgba(148,163,184,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong style={{ color: '#F1F5F9', fontSize: 15 }}>{ee.name}</strong>
                    <span style={{ color: '#94A3B8', fontSize: 13, marginLeft: 12 }}>{ee.department} · {ee.position}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={sty.btn(false)} onClick={() => setExpandedId(expandedId === ee.id ? null : ee.id)}>
                      {expandedId === ee.id ? '평가 접기' : '평가 내역'}
                    </button>
                    <button style={sty.btn(false)} onClick={() => { setShowAddEv(ee.id); setFormEv({ period: '2025-12-31', department: ee.department || '', position: ee.position || '', evaluator1: '', evaluator2: '', method: '절대평가', score: '', grade: '', rank: '', feedback1: '', feedback2: '' }); }}>+ 평가 추가</button>
                    <button style={{ ...sty.btn(false), color: '#F87171' }} onClick={() => handleDeleteEe(ee.id, ee.name)}>삭제</button>
                  </div>
                </div>
                {expandedId === ee.id && (
                  <div style={{ marginTop: 16 }}>
                    {loading && <p style={{ color: '#94A3B8', fontSize: 13 }}>로딩 중…</p>}
                    {!loading && evals[ee.id] && (
                      <>
                        <table style={sty.table}>
                          <thead>
                            <tr>
                              <th style={sty.th}>분기</th>
                              <th style={sty.th}>점수</th>
                              <th style={sty.th}>등급</th>
                              <th style={sty.th}>순위</th>
                              <th style={sty.th}>1차평가</th>
                              <th style={sty.th}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(evals[ee.id] || []).map((ev) => (
                              <tr key={ev.id}>
                                <td style={sty.td}>{PERIOD_LABELS[ev.period] || ev.period}</td>
                                <td style={sty.td}>{ev.score != null ? ev.score : '-'}</td>
                                <td style={{ ...sty.td, color: GRADE_COLORS[ev.grade] || '#94A3B8', fontWeight: 700 }}>{ev.grade || '-'}</td>
                                <td style={sty.td}>{ev.rank != null ? ev.rank : '-'}</td>
                                <td style={sty.td}>{ev.evaluator1 || '-'}</td>
                                <td style={sty.td}>
                                  <button style={{ ...sty.btn(false), padding: '4px 10px', fontSize: 12 }} onClick={() => openEditEv(ev)}>수정</button>
                                  <button style={{ ...sty.btn(false), padding: '4px 10px', fontSize: 12, color: '#F87171', marginLeft: 6 }} onClick={() => handleDeleteEv(ev.id, ee.id)}>삭제</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {(evals[ee.id] || []).length === 0 && <p style={{ color: '#94A3B8', fontSize: 13 }}>등록된 평가가 없습니다.</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddEv && (
        <div style={sty.card}>
          <h3 style={{ fontSize: 16, color: '#F1F5F9', marginBottom: 16 }}>평가 추가</h3>
          <form onSubmit={handleAddEv}>
            <select style={sty.input} value={formEv.period} onChange={(e) => setFormEv((p) => ({ ...p, period: e.target.value }))}>
              {PERIODS.map((p) => <option key={p} value={p}>{PERIOD_LABELS[p]} ({p})</option>)}
            </select>
            <input style={sty.input} placeholder="부서" value={formEv.department} onChange={(e) => setFormEv((p) => ({ ...p, department: e.target.value }))} />
            <input style={sty.input} placeholder="직급" value={formEv.position} onChange={(e) => setFormEv((p) => ({ ...p, position: e.target.value }))} />
            <input style={sty.input} placeholder="1차 평가자" value={formEv.evaluator1} onChange={(e) => setFormEv((p) => ({ ...p, evaluator1: e.target.value }))} />
            <input style={sty.input} placeholder="2차 평가자" value={formEv.evaluator2} onChange={(e) => setFormEv((p) => ({ ...p, evaluator2: e.target.value }))} />
            <input style={sty.input} placeholder="평가 방식" value={formEv.method} onChange={(e) => setFormEv((p) => ({ ...p, method: e.target.value }))} />
            <input style={sty.input} type="number" placeholder="점수" value={formEv.score} onChange={(e) => setFormEv((p) => ({ ...p, score: e.target.value }))} />
            <input style={sty.input} placeholder="등급 (A/B/C/D)" value={formEv.grade} onChange={(e) => setFormEv((p) => ({ ...p, grade: e.target.value }))} />
            <input style={sty.input} type="number" placeholder="순위" value={formEv.rank} onChange={(e) => setFormEv((p) => ({ ...p, rank: e.target.value }))} />
            <textarea style={{ ...sty.input, minHeight: 60 }} placeholder="1차 피드백" value={formEv.feedback1} onChange={(e) => setFormEv((p) => ({ ...p, feedback1: e.target.value }))} />
            <textarea style={{ ...sty.input, minHeight: 60 }} placeholder="2차 피드백" value={formEv.feedback2} onChange={(e) => setFormEv((p) => ({ ...p, feedback2: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" style={sty.btn(true)}>저장</button>
              <button type="button" style={sty.btn(false)} onClick={() => setShowAddEv(null)}>취소</button>
            </div>
          </form>
        </div>
      )}

      {editEv && (
        <div style={sty.card}>
          <h3 style={{ fontSize: 16, color: '#F1F5F9', marginBottom: 16 }}>평가 수정</h3>
          <form onSubmit={handleUpdateEv}>
            <input style={sty.input} placeholder="분기" value={formEv.period} readOnly />
            <input style={sty.input} placeholder="부서" value={formEv.department} onChange={(e) => setFormEv((p) => ({ ...p, department: e.target.value }))} />
            <input style={sty.input} placeholder="직급" value={formEv.position} onChange={(e) => setFormEv((p) => ({ ...p, position: e.target.value }))} />
            <input style={sty.input} placeholder="1차 평가자" value={formEv.evaluator1} onChange={(e) => setFormEv((p) => ({ ...p, evaluator1: e.target.value }))} />
            <input style={sty.input} placeholder="2차 평가자" value={formEv.evaluator2} onChange={(e) => setFormEv((p) => ({ ...p, evaluator2: e.target.value }))} />
            <input style={sty.input} placeholder="평가 방식" value={formEv.method} onChange={(e) => setFormEv((p) => ({ ...p, method: e.target.value }))} />
            <input style={sty.input} type="number" placeholder="점수" value={formEv.score} onChange={(e) => setFormEv((p) => ({ ...p, score: e.target.value }))} />
            <input style={sty.input} placeholder="등급" value={formEv.grade} onChange={(e) => setFormEv((p) => ({ ...p, grade: e.target.value }))} />
            <input style={sty.input} type="number" placeholder="순위" value={formEv.rank} onChange={(e) => setFormEv((p) => ({ ...p, rank: e.target.value }))} />
            <textarea style={{ ...sty.input, minHeight: 60 }} placeholder="1차 피드백" value={formEv.feedback1} onChange={(e) => setFormEv((p) => ({ ...p, feedback1: e.target.value }))} />
            <textarea style={{ ...sty.input, minHeight: 60 }} placeholder="2차 피드백" value={formEv.feedback2} onChange={(e) => setFormEv((p) => ({ ...p, feedback2: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" style={sty.btn(true)}>저장</button>
              <button type="button" style={sty.btn(false)} onClick={() => setEditEv(null)}>취소</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
