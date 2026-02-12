import * as XLSX from 'xlsx';
import { seedFromRawData } from './evaluationApi';

const PERIOD_MAP = {
  '2024-09-30': true, '2024-12-31': true, '2025-03-31': true,
  '2025-06-30': true, '2025-09-30': true, '2025-12-31': true,
};
const PERIOD_ALIAS = {
  '24q3': '2024-09-30', '24q4': '2024-12-31', '25q1': '2025-03-31',
  '25q2': '2025-06-30', '25q3': '2025-09-30', '25q4': '2025-12-31',
  '43분기': '2025-09-30', '44분기': '2025-12-31', '4/4분기': '2025-12-31',
  '2025년4분기': '2025-12-31', '2024년3분기': '2024-09-30', '2024년4분기': '2024-12-31',
  '2025년1분기': '2025-03-31', '2025년2분기': '2025-06-30', '2025년3분기': '2025-09-30',
};

const COLUMN_ALIASES = {
  name: ['이름', '성명', 'name', '피평가자', '직원명'],
  department: ['부서', 'department', 'dept'],
  position: ['직급', '직위', 'position', 'grade'],
  period: ['분기', 'period', '평가기간', '평가분기', '기간'],
  evaluator1: ['1차평가자', '평가자1', 'evaluator1', '1차 평가자'],
  evaluator2: ['2차평가자', '평가자2', 'evaluator2', '2차 평가자'],
  method: ['평가방식', '방식', 'method', '평가 방법'],
  score: ['점수', 'score', '평가점수'],
  grade: ['등급', 'grade', '평가등급'],
  rank: ['순위', 'rank'],
  feedback1: ['1차피드백', '피드백1', 'feedback1', '1차 피드백', 'feedback'],
  feedback2: ['2차피드백', '피드백2', 'feedback2', '2차 피드백'],
};

function normalizeHeader(str) {
  if (str == null) return '';
  return String(str).trim().toLowerCase().replace(/\s/g, '');
}

function matchColumn(header, field) {
  const n = normalizeHeader(header);
  if (!n) return false;
  const aliases = COLUMN_ALIASES[field];
  if (!aliases) return false;
  return aliases.some((a) => normalizeHeader(a) === n || n.includes(normalizeHeader(a)));
}

function findColumnIndex(headers, field) {
  for (let i = 0; i < headers.length; i++) {
    if (matchColumn(headers[i], field)) return i;
  }
  return -1;
}

function normalizePeriod(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (PERIOD_MAP[s]) return s;
  const lower = s.toLowerCase().replace(/\s/g, '');
  const q = lower.replace(/\./g, '');
  if (PERIOD_ALIAS[q]) return PERIOD_ALIAS[q];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/(\d{2})q(\d)/i) || s.match(/(\d{4})[.-](\d{1,2})/);
  if (m) {
    const y = m[1].length === 2 ? `20${m[1]}` : m[1];
    const qNum = parseInt(m[2], 10);
    const endMonth = { 1: '03-31', 2: '06-30', 3: '09-30', 4: '12-31' }[qNum];
    if (endMonth) return `${y}-${endMonth}`;
  }
  return s;
}

function num(val) {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

/**
 * 엑셀 파일(File)을 파싱해 evaluatees/evaluations용 행 배열 반환.
 * 첫 시트, 첫 행을 헤더로 사용. 컬럼명은 한/영 별칭으로 매칭.
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });
        const firstSheet = wb.SheetNames[0];
        if (!firstSheet) {
          reject(new Error('시트가 없습니다.'));
          return;
        }
        const ws = wb.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (rows.length < 2) {
          reject(new Error('헤더와 데이터 행이 필요합니다.'));
          return;
        }
        const headers = rows[0].map((h) => (h != null ? String(h) : ''));
        const nameIdx = findColumnIndex(headers, 'name');
        if (nameIdx < 0) {
          reject(new Error('"이름" 또는 "성명" 컬럼을 찾을 수 없습니다.'));
          return;
        }
        const idx = {
          name: nameIdx,
          department: findColumnIndex(headers, 'department'),
          position: findColumnIndex(headers, 'position'),
          period: findColumnIndex(headers, 'period'),
          evaluator1: findColumnIndex(headers, 'evaluator1'),
          evaluator2: findColumnIndex(headers, 'evaluator2'),
          method: findColumnIndex(headers, 'method'),
          score: findColumnIndex(headers, 'score'),
          grade: findColumnIndex(headers, 'grade'),
          rank: findColumnIndex(headers, 'rank'),
          feedback1: findColumnIndex(headers, 'feedback1'),
          feedback2: findColumnIndex(headers, 'feedback2'),
        };
        const out = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] || [];
          const name = row[idx.name] != null ? String(row[idx.name]).trim() : '';
          if (!name) continue;
          const period = idx.period >= 0 ? normalizePeriod(row[idx.period]) : '2025-12-31';
          out.push({
            period: period || '2025-12-31',
            name,
            department: idx.department >= 0 ? String(row[idx.department] ?? '').trim() : '',
            position: idx.position >= 0 ? String(row[idx.position] ?? '').trim() : '',
            evaluator1: idx.evaluator1 >= 0 ? String(row[idx.evaluator1] ?? '').trim() : '',
            evaluator2: idx.evaluator2 >= 0 ? String(row[idx.evaluator2] ?? '').trim() : '',
            method: idx.method >= 0 ? String(row[idx.method] ?? '').trim() : '절대평가',
            score: idx.score >= 0 ? num(row[idx.score]) : null,
            grade: idx.grade >= 0 ? String(row[idx.grade] ?? '').trim() : '',
            rank: idx.rank >= 0 ? (num(row[idx.rank]) != null ? parseInt(row[idx.rank], 10) : null) : null,
            feedback1: idx.feedback1 >= 0 ? String(row[idx.feedback1] ?? '').trim() : '',
            feedback2: idx.feedback2 >= 0 ? String(row[idx.feedback2] ?? '').trim() : '',
          });
        }
        resolve(out);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 파싱된 행 배열을 Supabase에 반영 (기존 seedFromRawData 활용)
 */
export async function importParsedRows(rows) {
  if (!rows || rows.length === 0) throw new Error('입력할 데이터가 없습니다.');
  await seedFromRawData(rows);
}
