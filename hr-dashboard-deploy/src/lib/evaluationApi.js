import { supabase } from '../supabaseClient';

/**
 * 대시보드용: evaluatees + evaluations 조인하여 RAW_DATA와 동일한 형태의 배열 반환
 */
export async function fetchRawData() {
  const { data: evaluations, error: evalErr } = await supabase
    .from('evaluations')
    .select(`
      id,
      period,
      department,
      position,
      evaluator1,
      evaluator2,
      method,
      score,
      grade,
      rank,
      feedback1,
      feedback2,
      evaluatee_id,
      evaluatees(name)
    `)
    .order('period')
    .order('rank');

  if (evalErr) throw evalErr;

  return (evaluations || []).map((row) => {
    const name = row.evaluatees?.name ?? '';
    return {
      id: row.id,
      period: row.period,
      name,
      department: row.department || '',
      position: row.position || '',
      evaluator1: row.evaluator1 || '',
      evaluator2: row.evaluator2 || '',
      method: row.method || '',
      score: row.score != null ? Number(row.score) : null,
      grade: row.grade || '',
      rank: row.rank != null ? row.rank : null,
      feedback1: row.feedback1 || '',
      feedback2: row.feedback2 || '',
      evaluatee_id: row.evaluatee_id,
    };
  });
}

export async function fetchEvaluatees() {
  const { data, error } = await supabase
    .from('evaluatees')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function fetchEvaluationsByEvaluatee(evaluateeId) {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('evaluatee_id', evaluateeId)
    .order('period');
  if (error) throw error;
  return data || [];
}

export async function addEvaluatee({ name, department = '', position = '' }) {
  const { data, error } = await supabase
    .from('evaluatees')
    .insert({ name: name.trim(), department: department.trim(), position: position.trim() })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateEvaluatee(id, { name, department, position }) {
  const { error } = await supabase
    .from('evaluatees')
    .update({
      name: name != null ? name.trim() : undefined,
      department: department != null ? department.trim() : undefined,
      position: position != null ? position.trim() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteEvaluatee(id) {
  const { error } = await supabase.from('evaluatees').delete().eq('id', id);
  if (error) throw error;
}

export async function addEvaluation(evaluateeId, row) {
  const payload = {
    evaluatee_id: evaluateeId,
    period: row.period,
    department: (row.department ?? '').toString().trim(),
    position: (row.position ?? '').toString().trim(),
    evaluator1: (row.evaluator1 ?? '').toString().trim(),
    evaluator2: (row.evaluator2 ?? '').toString().trim(),
    method: (row.method ?? '').toString().trim(),
    score: row.score != null && row.score !== '' ? Number(row.score) : null,
    grade: (row.grade ?? '').toString().trim(),
    rank: row.rank != null && row.rank !== '' ? parseInt(row.rank, 10) : null,
    feedback1: (row.feedback1 ?? '').toString().trim(),
    feedback2: (row.feedback2 ?? '').toString().trim(),
  };
  const { data, error } = await supabase.from('evaluations').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function updateEvaluation(id, row) {
  const payload = {
    period: row.period,
    department: (row.department ?? '').toString().trim(),
    position: (row.position ?? '').toString().trim(),
    evaluator1: (row.evaluator1 ?? '').toString().trim(),
    evaluator2: (row.evaluator2 ?? '').toString().trim(),
    method: (row.method ?? '').toString().trim(),
    score: row.score != null && row.score !== '' ? Number(row.score) : null,
    grade: (row.grade ?? '').toString().trim(),
    rank: row.rank != null && row.rank !== '' ? parseInt(row.rank, 10) : null,
    feedback1: (row.feedback1 ?? '').toString().trim(),
    feedback2: (row.feedback2 ?? '').toString().trim(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('evaluations').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteEvaluation(id) {
  const { error } = await supabase.from('evaluations').delete().eq('id', id);
  if (error) throw error;
}

/**
 * RAW_DATA 형태의 배열로 evaluatees + evaluations 시드. 기존 동일 name/period는 upsert.
 */
export async function seedFromRawData(rows) {
  if (!rows || rows.length === 0) return;
  const names = [...new Set(rows.map((r) => r.name))];
  const nameToId = {};

  for (const name of names) {
    let { data: ee } = await supabase.from('evaluatees').select('id').eq('name', name).maybeSingle();
    if (!ee) {
      const first = rows.find((r) => r.name === name);
      const { data: inserted, error } = await supabase
        .from('evaluatees')
        .insert({
          name,
          department: (first.department ?? '').toString().trim(),
          position: (first.position ?? '').toString().trim(),
        })
        .select('id')
        .single();
      if (error) throw error;
      ee = inserted;
    }
    nameToId[name] = ee.id;
  }

  for (const row of rows) {
    const payload = {
      evaluatee_id: nameToId[row.name],
      period: row.period,
      department: (row.department ?? '').toString().trim(),
      position: (row.position ?? '').toString().trim(),
      evaluator1: (row.evaluator1 ?? '').toString().trim(),
      evaluator2: (row.evaluator2 ?? '').toString().trim(),
      method: (row.method ?? '').toString().trim(),
      score: row.score != null && row.score !== '' ? Number(row.score) : null,
      grade: (row.grade ?? '').toString().trim(),
      rank: row.rank != null && row.rank !== '' ? parseInt(row.rank, 10) : null,
      feedback1: (row.feedback1 ?? '').toString().trim(),
      feedback2: (row.feedback2 ?? '').toString().trim(),
    };
    await supabase.from('evaluations').upsert(payload, {
      onConflict: 'evaluatee_id,period',
    });
  }
}
