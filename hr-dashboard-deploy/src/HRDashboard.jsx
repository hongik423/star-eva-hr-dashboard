import { useState, useMemo, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, ComposedChart, Area, ReferenceLine } from "recharts";
import { Sparkles, Mail, FileText, Loader2, X, RefreshCw, Star, Settings } from "lucide-react";
import { callAIAPI } from "./lib/aiApi";
import { getAiApiConfig, setAiApiConfig, hasAiApiKey } from "./lib/aiApiConfig";

// ═══════════════════════════════════════════════════════════════
// 🤖 AI API 환경설정 폼 (모달 내부)
// ═══════════════════════════════════════════════════════════════
function AiApiSettingsForm({ onSave, onCancel }) {
  const config = getAiApiConfig();
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  const [model, setModel] = useState(config.model || "gemini-2.5-flash-preview-09-2025");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    const key = apiKey.trim();
    if (!key) {
      setMessage("API 키를 입력해 주세요.");
      return;
    }
    setAiApiConfig({ apiKey: key, provider: "gemini", model: model.trim() || "gemini-2.5-flash-preview-09-2025" });
    setSaved(true);
    setMessage("저장되었습니다. 이제 AI 분석을 사용할 수 있습니다.");
    setTimeout(() => { setSaved(false); onSave(); }, 1200);
  };

  const formStyle = {
    input: { width: "100%", boxSizing: "border-box", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#E2E8F0", outline: "none", marginBottom: 16 },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: "#94A3B8", marginBottom: 6 },
    btn: { background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginRight: 8 },
    btnCancel: { background: "rgba(148,163,184,0.2)", color: "#94A3B8", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20, lineHeight: 1.6 }}>
        AI 분석(직원 상세 분석, 메일 초안, 부서 브리핑)에 사용할 Google Gemini API 키를 입력하세요. API 키는 이 기기에만 저장되며 서버로 전송되지 않습니다.
      </p>
      <label style={formStyle.label}>API 키 (필수)</label>
      <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." style={formStyle.input} autoComplete="off" />
      <label style={formStyle.label}>모델 (선택)</label>
      <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="gemini-2.5-flash-preview-09-2025" style={formStyle.input} />
      {message && <p style={{ fontSize: 13, color: saved ? "#34D399" : "#F87171", marginBottom: 12 }}>{message}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
        <button type="submit" style={formStyle.btn}>저장</button>
        <button type="button" onClick={onCancel} style={formStyle.btnCancel}>취소</button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🔒 RAW DATA (CSV/XLSX 원본 기반 — 수정 및 추정 금지)
// ═══════════════════════════════════════════════════════════════
const RAW_DATA = [
  // ── 2024 Q3 (2024-09-30) ──
  {period:"2024-09-30",name:"이다은",department:"마케팅",position:"GR2",evaluator1:"나동환",evaluator2:"",method:"편차보정",score:76.5,grade:"B",rank:2,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"한소혜",department:"마케팅",position:"GR1",evaluator1:"이다은",evaluator2:"",method:"편차보정",score:42.7,grade:"D",rank:12,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"강윤정",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:67.2,grade:"C",rank:4,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"최현서",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:69.2,grade:"C",rank:3,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"배지은",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:43.4,grade:"D",rank:11,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"박수용",department:"대외협력센터",position:"GR3",evaluator1:"나동환",evaluator2:"",method:"편차보정",score:51.4,grade:"D",rank:9,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"김준연",department:"BSP",position:"GR3",evaluator1:"주경훈",evaluator2:"",method:"편차보정",score:56.3,grade:"D",rank:6,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"한승민",department:"BSP",position:"GR3",evaluator1:"나동환",evaluator2:"",method:"편차보정",score:51.8,grade:"D",rank:8,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"홍성일",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"주경훈",method:"편차보정",score:78.8,grade:"B",rank:1,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"양인규",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"주경훈",method:"편차보정",score:54.4,grade:"D",rank:7,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"이병곤",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"주경훈",method:"편차보정",score:47.4,grade:"D",rank:10,feedback1:"",feedback2:""},
  {period:"2024-09-30",name:"김명중",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"주경훈",method:"편차보정",score:66.9,grade:"C",rank:5,feedback1:"",feedback2:""},
  // ── 2024 Q4 (2024-12-31) ──
  {period:"2024-12-31",name:"이다은",department:"마케팅",position:"GR3",evaluator1:"나동환",evaluator2:"",method:"편차보정",score:72.6,grade:"B",rank:1,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"이은아",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"편차보정",score:56.3,grade:"D",rank:6,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"강윤정",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:53.0,grade:"D",rank:8,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"최현서",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:71.5,grade:"B",rank:2,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"구실",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:44.4,grade:"D",rank:10,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"박수용",department:"대외협력센터",position:"GR3",evaluator1:"주경훈",evaluator2:"나동환",method:"편차보정",score:43.8,grade:"D",rank:11,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"한승민",department:"BSP",position:"GR3",evaluator1:"주경훈",evaluator2:"나동환",method:"편차보정",score:52.5,grade:"D",rank:9,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"홍성일",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"주경훈",method:"편차보정",score:68.1,grade:"C",rank:3,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"양인규",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"주경훈",method:"편차보정",score:60.9,grade:"D",rank:5,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"이병곤",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"주경훈",method:"편차보정",score:55.9,grade:"D",rank:7,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"김명중",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"주경훈",method:"편차보정",score:66.3,grade:"C",rank:4,feedback1:"",feedback2:""},
  {period:"2024-12-31",name:"정상훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"편차보정",score:32.4,grade:"D",rank:12,feedback1:"",feedback2:""},
  // ── 2025 Q1 (2025-03-31) ──
  {period:"2025-03-31",name:"이다은",department:"마케팅",position:"GR3",evaluator1:"나동환",evaluator2:"",method:"편차보정",score:75.0,grade:"B",rank:3,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"이은아",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"편차보정",score:44.3,grade:"D",rank:10,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"박지영",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"편차보정",score:75.0,grade:"B",rank:4,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"강윤정",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:48.6,grade:"D",rank:9,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"최현서",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:80.6,grade:"B",rank:1,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"구실",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"편차보정",score:49.9,grade:"D",rank:8,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"한승민",department:"BSP",position:"GR4",evaluator1:"나동환",evaluator2:"",method:"편차보정",score:44.3,grade:"D",rank:11,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"홍성일",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"편차보정",score:74.4,grade:"B",rank:5,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"양인규",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"편차보정",score:76.6,grade:"B",rank:2,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"이병곤",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"편차보정",score:59.5,grade:"D",rank:7,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"김명중",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"편차보정",score:69.0,grade:"C",rank:6,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"정상훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"편차보정",score:38.9,grade:"D",rank:13,feedback1:"",feedback2:""},
  {period:"2025-03-31",name:"이제훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"편차보정",score:39.9,grade:"D",rank:12,feedback1:"",feedback2:""},
  // ── 2025 Q2 (2025-06-30) ──
  {period:"2025-06-30",name:"이다은",department:"마케팅",position:"GR3",evaluator1:"나동환",evaluator2:"",method:"절대평가",score:86.0,grade:"A",rank:4,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"이은아",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"절대평가",score:72.0,grade:"B",rank:9,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"박지영",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"절대평가",score:70.0,grade:"C",rank:10,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"최현서",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:79.5,grade:"B",rank:6,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"구실",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:65.0,grade:"C",rank:11,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"한승민",department:"BSP",position:"GR4",evaluator1:"나동환",evaluator2:"",method:"절대평가",score:89.0,grade:"A",rank:1,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"홍성일",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:75.2,grade:"B",rank:8,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"양인규",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:86.2,grade:"A",rank:3,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"이병곤",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:62.2,grade:"C",rank:12,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"김명중",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:82.2,grade:"A",rank:5,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"정상훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:86.6,grade:"A",rank:2,feedback1:"",feedback2:""},
  {period:"2025-06-30",name:"이제훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:76.6,grade:"B",rank:7,feedback1:"",feedback2:""},
  // ── 2025 Q3 (2025-09-30) ──
  {period:"2025-09-30",name:"이다은",department:"마케팅",position:"GR3",evaluator1:"나동환",evaluator2:"",method:"절대평가",score:74.0,grade:"B",rank:9,feedback1:"",feedback2:""},
  {period:"2025-09-30",name:"이은아",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"절대평가",score:64.0,grade:"C",rank:11,feedback1:"",feedback2:""},
  {period:"2025-09-30",name:"박지영",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"절대평가",score:50.0,grade:"D",rank:14,feedback1:"이다은 팀장 코멘트: 본 평가는 평가 문항의 기준에 따라 객관적으로 진행하였으나, 박지영 매니저의 경우 3분기부터 직무 변경으로 새로운 업무를 부여받아 수행한 점을 감안해주시기 바랍니다. 영상 관련 전공자이거나 유사 경력자가 아닌 상태에서 사실상 신입 수준으로 새 직무를 시작하였음에도, 적극적이고 흔쾌한 태도로 업무에 임하며 새로운 역할에 적응하는 시기를 보냈습니다.",feedback2:""},
  {period:"2025-09-30",name:"최현서",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:77.5,grade:"B",rank:6,feedback1:"ㅇ 7월에 관제 및 경리 업무를 처음 부여받아, 실수를 최대한 방지하도록 야근을 감수하고 최선의 노력을 수행함. 업무수행에 있어 숙련도는 없지만 업무량으로 보완하고자 하는 성실성에 점수를 부여함.",feedback2:""},
  {period:"2025-09-30",name:"구실",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:69.5,grade:"C",rank:10,feedback1:"ㅇ 분기마다 코멘트되는 부분이 개선되는 상황이 나오지 않음. 현장 위원분들과의 소통에서는 오류나 에티켓상 컴플레인을 듣지 않음. 업무의 범위를 넓히거나 시스템을 개선하는 등의 상위적 요소는 찾기 어려워 평균점수 이상의 평가를 부여할 수 없음.",feedback2:""},
  {period:"2025-09-30",name:"이찬숙",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:61.0,grade:"C",rank:12,feedback1:"ㅇ 기존의 계약관리(청약)업무에서 영업인사 업무로 변경되면서 학습의 기간이 있었음. 근태가 좋고 묵묵히 궂은일을 하는 접근자세는 긍정적인 평가를 줄 수 있으나, 엑셀활용 및 문서작성 등은 현 시점에서 좋은 점수를 주기가 어려웠음.",feedback2:""},
  {period:"2025-09-30",name:"김한나",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:77.5,grade:"B",rank:6,feedback1:"ㅇ 업계신입은 물론이고, 사회경험도 많지 않은 수습기간에도 불구하고, 의사소통 및 지시이해도에 어려움을 거의 느끼지 못할 정도로 흡수능력이 뛰어났음. 업무를 배우고 습득하는 과정의 자신감이 매우 좋고 새로운 것을 배우는데 대한 의욕이 좋았음.",feedback2:""},
  {period:"2025-09-30",name:"한승민",department:"BSP",position:"GR4",evaluator1:"나동환",evaluator2:"",method:"절대평가",score:83.0,grade:"A",rank:3,feedback1:"신규 제휴자 목표달성율: 3분기 목표 99명, 실적 134명, 달성율 135.4%. 파트너 세무사 순증가율: 3분기 목표 62명, 실적 79명, 달성율 127.4%.",feedback2:""},
  {period:"2025-09-30",name:"홍성일",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:75.0,grade:"B",rank:8,feedback1:"[확대] 기존 파트너 세무사 대상 소개 이벤트 적극활용. 총 12명 소개받아, 신규 파트너 7명 / 멤버 5명 체결. [연말파트너순증] 개인 연간목표(36명) 3분기 마감과 동시에 조기달성.",feedback2:""},
  {period:"2025-09-30",name:"양인규",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:82.4,grade:"A",rank:4,feedback1:"[확대] 세무법인 제휴 업무 추진 중 - 2개의 세무법인과 협상 진행중. [연말파트너순증] 개인 연간목표(36명) 3분기 마감과 동시에 조기달성 - 9월기준 파트너순증 누적계: 41명.",feedback2:""},
  {period:"2025-09-30",name:"이병곤",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:58.6,grade:"D",rank:13,feedback1:"[확대] 광범위한 지역 커버리지 - 광주 지역 신규 확대 리드 저하로 대전, 수도권까지 업무 지역 확대. [관리] 광주 지역 파트너 관리 및 세션 운영 주도.",feedback2:""},
  {period:"2025-09-30",name:"김명중",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:79.6,grade:"B",rank:5,feedback1:"[확대] 세미나 후속대응 진행 - 부재 및 개인사정으로 인한 미팅 일정 연기자 대상 선별/미팅 진행. [생산] 파트너 세무사 대상 금융 Ri 생산 활동 진행.",feedback2:""},
  {period:"2025-09-30",name:"정상훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:87.6,grade:"A",rank:1,feedback1:"[확대] 수도권 지역 세미나 후속대응 및 인바운드 후속대응. [신규제휴] 개인 연간목표(48명) 3분기 마감과 동시에 조기달성 - 9월기준 신규제휴 누적계: 49명.",feedback2:""},
  {period:"2025-09-30",name:"이제훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:86.6,grade:"A",rank:2,feedback1:"[확대] 수도권 지역 세미나 후속대응 및 인바운드 후속대응. [생산] 파트너, 멤버 세무사 대상 Ri 생산 활동 진행 - 세무사 성향, 지역 특성, 보유 기장 환경을 종합 분석하여 맞춤형 Ri 제안 추진. [업무 고도화] 신규 금융 비즈니스 모델 수립 및 수행.",feedback2:""},
  // ── 2025 Q4 (2025-12-31) ──
  {period:"2025-12-31",name:"이다은",department:"마케팅",position:"GR3",evaluator1:"나동환",evaluator2:"",method:"절대평가",score:76.0,grade:"B",rank:8,feedback1:"자기평가: (1) 온라인 특강 기획·운영 「고수익 세무사의 비밀 5대 핵심 특강」 원소스 멀티유즈 방식으로 운영하여 비용 절감. (2) 조직 운영 및 인력 관리 - 조종범 센터장 입사 이후 주요 업무 전반에 대해 단계적 인수인계 진행. 이현준 매니저 채용 및 온보딩 과정 진행. (3) 2026년도 사업계획 수립 착수.",feedback2:""},
  {period:"2025-12-31",name:"이은아",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"절대평가",score:56.0,grade:"D",rank:13,feedback1:"(이다은 팀장 평가) 성실한 태도를 유지하고 있다는 점은 분명한 강점입니다. 다만 입사 후 1년이 경과한 시점임에도 불구하고, 초기 대비 전반적인 직무 역량의 향상 폭은 크지 않아 근속 기간 대비 성장 속도가 기대에는 미치지 못한 것으로 판단됩니다. 종합적으로 D등급을 부여하였습니다.",feedback2:""},
  {period:"2025-12-31",name:"박지영",department:"마케팅",position:"GR2",evaluator1:"이다은",evaluator2:"",method:"절대평가",score:62.0,grade:"C",rank:12,feedback1:"(이다은 팀장 평가) 적극적이고 능동적인 태도를 갖췄고 아이디어도 비교적 우수한 편이나 몇 가지 보완이 필요한 부분이 확인됩니다. 특히 엑셀 기반 데이터 정리 및 수치 관리 과정에서 반복적으로 오류가 발생. 현재 영상 콘텐츠 직무를 담당한 지 약 6개월로, 직무 전환 이후 아직 미숙한 부분이 존재합니다.",feedback2:""},
  {period:"2025-12-31",name:"최현서",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:81.0,grade:"A",rank:2,feedback1:"7월이후 부여받은 경험치 없는 신규업무에 대하여, 인수인계가 부족한 상황에서 6개월이내에 업무적 안정성을 취득한것에 대해 높은 평가를 부여함. 업무에 대한 능력보다도 '태도'에 대한 장점을 나타냄. 다만 담당자선에서 80% 이상의 결정의견을 가지고 의사결정을 요청하는 것이 이상적이나, 아직은 60%정도의 본인의견을 가지고 의사결정을 요청함.",feedback2:"[2차평가] 관제업무: 유입, 배정, 데이터 관리의 기본업무들은 안정적으로 잘 운영하고 있음. 데이터 정리를 넘어 결과를 분석하고, 실무자로서 개선 방향을 제안할 수 있는 단계로 성장해야 함. 재무업무: 경리나 재무업무의 기본개념과 흐름을 파악하고 안정적으로 수행하고 있음."},
  {period:"2025-12-31",name:"구실",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:67.5,grade:"C",rank:9,feedback1:"실수없이 안정적으로 수행하는 부분에 있어서 루틴한 업무를 놓치지 않는 긍정적 평가. 청약업무는 오류가 있다면 매우 큰 문제를 가져올 수 있기 때문에, 세세한 부분까지 자문위원과 소통하는데 주저함이 없음. 다만 업무의 범위를 넓히거나, 시스템을 개선하는 등 상위적 행동이 발견되지 않아 아쉬움.",feedback2:"[2차평가] 자기평가시 해당 분기에 이룬 성과에 대해 구체적으로 기술할 필요가 있음. 적극적으로 소통하고 협업하려고 노력하는 모습은 이전보다 좋아진 것 같음."},
  {period:"2025-12-31",name:"이찬숙",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:65.0,grade:"C",rank:10,feedback1:"오랜기간의 업무경력이 '청약'에 맞춰져 있었으나, 당사합류이후 새로운 '인사'업무를 맡아 오류없이 잘 수행하고 있음. 업무를 조용히 차분하게 처리하는 스타일이어서 현장과의 소통에서 문제 피드백이 없음. 다만 세련미는 보다 많은 노력을 해야 하고, 엑셀활용 및 문서작성 등은 현 시점에서 좋은 점수를 주기가 어려웠음.",feedback2:"[2차평가] 기존에 익숙한 업무는 그 누구보다 잘 해야 하고, 회사의 비즈니스 상황에 맞게 부여되는 새로운 업무도 믿고 맡길 수 있는 유연하고 학습력있는 인재로 성장하길 바랍니다. 신입 마인드에서 벗어나 좀 더 주도적으로 업무에 임해주세요."},
  {period:"2025-12-31",name:"김한나",department:"운영지원부",position:"GR2",evaluator1:"남형규",evaluator2:"강선애",method:"절대평가",score:80.5,grade:"B",rank:3,feedback1:"김한나 매니저의 가장 탁월한 장점은 '태도와 행동'으로 요약될 수 있음. 가장 산만한 업무를 맡았음에도 불구하고, 업무를 받는 태도와 부정적인 기운이 안보이는 것, 업무지시에 대한 망설임이나 주저함이 없이 바로 행동을 시작하는 점이 비슷한 연령대에서 찾기 어려운 직원이라고 보임.",feedback2:"[2차평가] 전반적으로 업무에 대한 이해, 처리속도, 퀄리티 모두 좋은 평가를 줄 수 있음. 4분기에 새로 시작한 TAG We, 신탁협회 지원 등 수명업무들을 안정감 있게 잘 수행함. 그러나 루틴한 업무의 경우 디테일이 떨어지거나 습관적으로 처리하면서 실수가 발생하고 있어 주의를 요함."},
  {period:"2025-12-31",name:"한승민",department:"BSP",position:"GR4",evaluator1:"나동환",evaluator2:"",method:"절대평가",score:78.0,grade:"B",rank:6,feedback1:"1. 컨설팅 칼리지 인천 운영 성과 - 고양/송도 지역 중심 소규모 세미나 기획 및 운영. 대규모 세미나 대비 참여도, 제휴체결율, ROI 검증 완료. 2. 조직 운영 및 성과 관리 - BSP센터 인원 증원 후 안정적 운영. 직원별 KPI 기반 성과 관리 체계 안정화 시도.",feedback2:""},
  {period:"2025-12-31",name:"홍성일",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:77.4,grade:"B",rank:7,feedback1:"① 4분기 주요 역할 및 기여 - 기존 제휴 세무사를 통한 Ri 생산 및 신규 제휴자 확대 업무를 담당. 4분기 Ri 생산 성과가 기대 수준에 미치지 못한 가운데, 기존 제휴 세무사 소개 활성화를 통한 신규 Ri 생산에 주력함. ② 성과 수준 평가 - 일부 Ri 성과는 있었으나 부서 기대치에는 미달.",feedback2:""},
  {period:"2025-12-31",name:"양인규",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:54.6,grade:"D",rank:14,feedback1:"① 4분기 주요 역할 및 기여 - 기존 제휴 세무사를 통한 Ri 생산 및 신규 제휴자 확대 업무를 기본 역할로 수행. 세무법인 혜움과의 정책자금 서비스 협업 프로젝트를 전담. ② 성과 수준 평가 - 프로젝트 전담 기간 중 기존 Ri 생산 실적이 크게 하락하여, 전체 실적 기여도가 저조한 분기로 평가됨.",feedback2:""},
  {period:"2025-12-31",name:"이병곤",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:64.4,grade:"C",rank:11,feedback1:"① 4분기 주요 역할 및 기여 - 기존 제휴 세무사를 통한 Ri 생산 및 신규 제휴자 확대 업무를 담당. 수도권 업무를 병행 수행하며, 기존 담당 지역과 수도권 간 운영 공백이 발생하지 않도록 실무 조율 및 현장 대응. ② 성과 수준 평가 - 광주 지역 세션 운영 및 관리 활동은 개선되었으나, 실적 측면의 결과물은 여전히 기대에 미치지 못하는 상황.",feedback2:""},
  {period:"2025-12-31",name:"김명중",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:80.4,grade:"B",rank:4,feedback1:"① 4분기 주요 역할 및 기여 - 기존 제휴 세무사를 통한 Ri 생산 및 신규 제휴자 확대 업무를 담당. 수도권 지역 운영에 있어 담당 역할을 성실히 수행. ② 성과 수준 평가 - 4분기 활동량을 확대하며 Ri 절대량 기준으로 전분기 대비 성과 개선이 확인됨 (3분기 Ri 14개 → 4분기 Ri 증가).",feedback2:""},
  {period:"2025-12-31",name:"정상훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:85.8,grade:"A",rank:1,feedback1:"① 4분기 주요 역할 및 기여 - 기존 제휴 세무사를 통한 Ri 생산 및 신규 제휴자 확대 업무를 담당. 24년 12월 입사 후, 25년 4월부터 현장 업무에 본격 투입되어 비교적 짧은 기간 내 현장 운영 및 Ri 생산 업무를 안정적으로 수행함. 라운지 운영 및 Ri 활성화 미션에 집중하며 부서 내에서 안정적 실행력을 보여주었음.",feedback2:""},
  {period:"2025-12-31",name:"이제훈",department:"BSP",position:"GR3",evaluator1:"한승민",evaluator2:"",method:"절대평가",score:79.4,grade:"B",rank:5,feedback1:"① 4분기 주요 역할 및 기여 - 기존 제휴 세무사를 통한 Ri 생산 및 신규 제휴자 확대 업무를 담당. 신규 비즈니스 모델, Ri 전환 구조 개선 등 다수의 개선 아이디어 및 방향성을 제시하였으나, 실질적인 운영 구조 변경이나 성과로의 연결은 제한적 수준에 머무름. ② 전반적으로 정해진 업무 범위 내 실무 수행에 집중한 분기로 평가됨.",feedback2:""},
];

// ═══════════════════════════════════════════════════════════════
// 🎨 CONSTANTS
// ═══════════════════════════════════════════════════════════════
const GRADE_COLORS = { A: "#10B981", B: "#3B82F6", C: "#F59E0B", D: "#EF4444" };
const GRADE_BG = { A: "#ECFDF5", B: "#EFF6FF", C: "#FFFBEB", D: "#FEF2F2" };
const TREND_ICONS = { up: "▲", down: "▼", stable: "━" };
const TREND_COLORS = { up: "#22C55E", down: "#EF4444", stable: "#6B7280" };
const RISK_COLORS = { High: "#DC2626", Medium: "#F97316", Low: "#84CC16" };

const PERIODS = ["2024-09-30","2024-12-31","2025-03-31","2025-06-30","2025-09-30","2025-12-31"];
const PERIOD_LABELS = {"2024-09-30":"24Q3","2024-12-31":"24Q4","2025-03-31":"25Q1","2025-06-30":"25Q2","2025-09-30":"25Q3","2025-12-31":"25Q4"};

// ═══════════════════════════════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════
const getQ4Data = () => RAW_DATA.filter(r => r.period === "2025-12-31").sort((a,b) => a.rank - b.rank);
const getUniqueNames = () => [...new Set(getQ4Data().map(r => r.name))];
const getDepts = () => [...new Set(getQ4Data().map(r => r.department))];

const getEmployeeHistory = (name) => {
  return PERIODS.map(p => {
    const rec = RAW_DATA.find(r => r.period === p && r.name === name);
    return rec ? { ...rec, label: PERIOD_LABELS[p] } : { period: p, label: PERIOD_LABELS[p], name, score: null, grade: null, rank: null };
  });
};

const calcTrend = (name) => {
  const hist = getEmployeeHistory(name).filter(h => h.score !== null);
  if (hist.length < 2) return "stable";
  const last2 = hist.slice(-2);
  const diff = last2[1].score - last2[0].score;
  if (diff > 3) return "up";
  if (diff < -3) return "down";
  return "stable";
};

const calcAvg = (name) => {
  const scores = getEmployeeHistory(name).filter(h => h.score !== null).map(h => h.score);
  return scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
};

const calcRisk = (name) => {
  const hist = getEmployeeHistory(name).filter(h => h.score !== null);
  if (hist.length < 2) return "Medium";
  const latest = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  const drop = prev.score - latest.score;
  if (latest.grade === "D" && drop > 10) return "High";
  if (latest.grade === "D" || drop > 15) return "High";
  if (latest.grade === "C" && drop > 5) return "Medium";
  if (latest.score < 60) return "Medium";
  return "Low";
};

const generateInsight = (name) => {
  const hist = getEmployeeHistory(name).filter(h => h.score !== null);
  const trend = calcTrend(name);
  const latest = hist[hist.length - 1];
  const avg = calcAvg(name);
  const risk = calcRisk(name);
  
  let insights = [];
  
  if (trend === "up" && latest.grade === "A") {
    insights.push(`${name}님은 지속적인 상승세를 보이며 A등급을 달성했습니다. 핵심 인재로서 보상 강화 및 리더십 역할 확대를 권장합니다.`);
  } else if (trend === "up") {
    insights.push(`${name}님은 최근 상승 추세를 보이고 있습니다. 현재 모멘텀을 유지할 수 있도록 적절한 도전 과제 부여가 필요합니다.`);
  } else if (trend === "down" && latest.grade === "D") {
    insights.push(`${name}님의 성과가 하락 추세에 있어 즉각적인 개입이 필요합니다. 1:1 면담을 통해 업무 장애 요인 파악 및 맞춤형 지원 방안을 마련하세요.`);
  } else if (trend === "down") {
    insights.push(`${name}님의 성과가 전분기 대비 하락했습니다. 원인 분석 후 개선 방향을 함께 설정해야 합니다.`);
  }
  
  if (hist.length >= 3) {
    const scores = hist.map(h => h.score);
    const stdDev = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length);
    if (stdDev > 15) {
      insights.push(`성과 편차(σ=${stdDev.toFixed(1)})가 크므로 성과 안정화 방안이 필요합니다.`);
    } else if (stdDev < 5 && avg > 75) {
      insights.push(`안정적으로 높은 성과를 유지하고 있습니다 (평균 ${avg.toFixed(1)}점, σ=${stdDev.toFixed(1)}).`);
    }
  }
  
  if (risk === "High") {
    insights.push("⚠️ 이탈 위험이 높으므로 긴급 면담 및 동기부여 방안 마련이 시급합니다.");
  }
  
  return insights.length ? insights.join(" ") : `${name}님은 현재 안정적인 수준의 성과를 보이고 있습니다. 다음 분기 목표 설정 시 성장 방향을 함께 논의하는 것을 권장합니다.`;
};

// ═══════════════════════════════════════════════════════════════
// 🧩 SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════
const GradeBadge = ({ grade }) => (
  <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:"50%", backgroundColor: GRADE_BG[grade] || "#F3F4F6", color: GRADE_COLORS[grade] || "#6B7280", fontWeight:800, fontSize:14, border:`2px solid ${GRADE_COLORS[grade] || "#D1D5DB"}` }}>
    {grade || "-"}
  </span>
);

const TrendBadge = ({ trend }) => (
  <span style={{ color: TREND_COLORS[trend], fontWeight: 700, fontSize: 16 }}>
    {TREND_ICONS[trend] || "━"}
  </span>
);

const RiskBadge = ({ level }) => (
  <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:12, fontSize:12, fontWeight:700, color:"#fff", backgroundColor: RISK_COLORS[level] || "#6B7280" }}>
    {level}
  </span>
);

const KPICard = ({ icon, title, value, sub, detail, borderColor }) => (
  <div style={{ background:"#fff", borderRadius:16, padding:"24px 20px", borderLeft:`5px solid ${borderColor}`, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", transition:"transform 0.2s", cursor:"default", flex:1, minWidth:180 }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
    <div style={{ fontSize:28, marginBottom:4 }}>{icon}</div>
    <div style={{ fontSize:12, color:"#6B7280", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", marginBottom:8 }}>{title}</div>
    <div style={{ fontSize:30, fontWeight:800, color:"#111827", lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:13, color:"#9CA3AF", marginTop:6 }}>{sub}</div>}
    {detail && <div style={{ fontSize:11, color:"#6B7280", marginTop:6, padding:"4px 8px", background:"#F3F4F6", borderRadius:6, lineHeight:1.5 }}>{detail}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(17,24,39,0.95)", padding:"12px 16px", borderRadius:10, color:"#fff", fontSize:13, maxWidth:260, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
      <div style={{ fontWeight:700, marginBottom:6, fontSize:14 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:p.color, display:"inline-block" }} />
          <span>{p.name}: <b>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}점</b></span>
        </div>
      ))}
    </div>
  );
};

const GradeDistTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{ background:"rgba(17,24,39,0.95)", padding:"12px 16px", borderRadius:10, color:"#fff", fontSize:13, maxWidth:260, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
      <div style={{ fontWeight:700, marginBottom:6, fontSize:14 }}>{label} <span style={{ fontWeight:400, color:"#94A3B8" }}>(총 {total}명)</span></div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:p.color, display:"inline-block" }} />
          <span>{p.name}: <b>{Math.round(p.value)}명</b></span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 🏗️ MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterDept, setFilterDept] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [sortKey, setSortKey] = useState("rank");
  const [sortDir, setSortDir] = useState("asc");

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [deptBriefing, setDeptBriefing] = useState(null);
  const [deptBriefingLoading, setDeptBriefingLoading] = useState(false);
  const [emailDraft, setEmailDraft] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);

  // ── Computed Data ──
  const q4Data = useMemo(() => {
    let data = getQ4Data().map(r => ({
      ...r,
      trend: calcTrend(r.name),
      avg: calcAvg(r.name),
      risk: calcRisk(r.name),
      insight: generateInsight(r.name)
    }));
    if (filterDept !== "all") data = data.filter(d => d.department === filterDept);
    if (filterGrade !== "all") data = data.filter(d => d.grade === filterGrade);
    data.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? (va||0) - (vb||0) : (vb||0) - (va||0);
    });
    return data;
  }, [filterDept, filterGrade, sortKey, sortDir]);

  const kpis = useMemo(() => {
    const all = getQ4Data();
    const avgScore = all.reduce((s, r) => s + r.score, 0) / all.length;
    const aList = all.filter(r => r.grade === "A");
    const aCount = aList.length;
    const aNames = aList.map(r => r.name).join(", ");
    const dCount = all.filter(r => r.grade === "D").length;
    const upList = all.filter(r => calcTrend(r.name) === "up");
    const upCount = upList.length;
    const upNames = upList.map(r => r.name).join(", ");
    const riskList = all.filter(r => calcRisk(r.name) === "High");
    const riskCount = riskList.length;
    const riskNames = riskList.map(r => r.name).join(", ");
    // Compare with Q3
    const q3 = RAW_DATA.filter(r => r.period === "2025-09-30");
    const q3Avg = q3.reduce((s, r) => s + r.score, 0) / q3.length;
    return { avgScore, aCount, aNames, dCount, upCount, upNames, riskCount, riskNames, q3Avg, total: all.length, aRatio: ((aCount/all.length)*100).toFixed(0) };
  }, []);

  const gradeDistData = useMemo(() => {
    return PERIODS.map(p => {
      const recs = RAW_DATA.filter(r => r.period === p);
      return {
        label: PERIOD_LABELS[p],
        A: recs.filter(r => r.grade === "A").length,
        B: recs.filter(r => r.grade === "B").length,
        C: recs.filter(r => r.grade === "C").length,
        D: recs.filter(r => r.grade === "D").length,
        total: recs.length
      };
    });
  }, []);

  const handleSort = useCallback((key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }, [sortKey]);

  // AI Handlers
  const handleAIAnalysis = async (employeeName) => {
    setAiLoading(true);
    const history = getEmployeeHistory(employeeName);
    const latest = RAW_DATA.find(r => r.name === employeeName && r.period === "2025-12-31");
    
    const prompt = `
      당신은 20년 경력의 HR 전문가이자 성과 코치입니다. 다음 직원의 데이터를 바탕으로 성장 중심의 피드백 리포트를 한국어로 작성해주세요.
      
      [직원 정보]
      이름: ${employeeName}, 부서: ${latest.department}, 직급: ${latest.position}
      2025 Q4 성과: 점수 ${latest.score}, 등급 ${latest.grade}
      
      [과거 성과 추이]
      ${JSON.stringify(history.filter(h=>h.score).map(h => ({분기: h.label, 점수: h.score, 등급: h.grade})))}
      
      [최근 평가자 피드백]
      1차 평가자: ${latest.feedback1 || "없음"}
      2차 평가자: ${latest.feedback2 || "없음"}
      
      [요청사항]
      1. **핵심 강점**: 데이터와 피드백에서 드러난 강점 2가지 요약.
      2. **개선 영역**: 성장을 위해 보완해야 할 구체적인 약점 1가지.
      3. **액션 플랜**: 다음 분기 성과 향상을 위한 구체적인 실행 가이드 3가지.
      
      톤앤매너: 전문적이고 객관적이면서도, 직원의 성장을 독려하는 따뜻한 어조.
    `;
    
    const result = await callAIAPI(prompt);
    setAiAnalysis(result);
    setAiLoading(false);
  };

  const handleEmailDraft = async (employeeName) => {
    setEmailLoading(true);
    const latest = RAW_DATA.find(r => r.name === employeeName && r.period === "2025-12-31");
    
    const prompt = `
      당신은 인사 팀장입니다. ${employeeName}님에게 보낼 2025년 4분기 인사평가 결과 및 피드백 이메일 초안을 작성해주세요.
      
      [평가 결과]
      점수: ${latest.score}, 등급: ${latest.grade}
      
      [주요 피드백 내용]
      ${latest.feedback1} ${latest.feedback2}
      
      [작성 가이드]
      - 제목: [인사평가] 2025년 4분기 평가 결과 및 피드백 안내
      - 서론: 노고에 대한 감사 인사.
      - 본론: 평가 등급 통보 및 주요 피드백 요약 (강점 인정 및 보완점 제시).
      - 결론: 다음 분기 기대 및 면담 요청 안내.
      - 매우 정중하고 격려하는 비즈니스 이메일 형식.
    `;
    
    const result = await callAIAPI(prompt);
    setEmailDraft(result);
    setEmailLoading(false);
  };

  const handleDeptBriefing = async (deptName) => {
    setDeptBriefingLoading(true);
    const members = getQ4Data().filter(r => r.department === deptName);
    const avgScore = members.reduce((s,r) => s+r.score, 0) / members.length;
    
    const prompt = `
      당신은 HR 데이터 분석가입니다. ${deptName} 부서의 2025년 4분기 성과 데이터를 분석하여 경영진 브리핑 문구를 작성해주세요.
      
      [부서 데이터]
      - 총원: ${members.length}명
      - 평균 점수: ${avgScore.toFixed(1)}점
      - 등급 분포: A(${members.filter(r=>r.grade==="A").length}), B(${members.filter(r=>r.grade==="B").length}), C(${members.filter(r=>r.grade==="C").length}), D(${members.filter(r=>r.grade==="D").length})
      - 주요 구성원: ${members.map(m => `${m.name}(${m.grade})`).join(", ")}
      
      [요청사항]
      - 부서의 전반적인 성과 분위기를 요약하세요.
      - 성과가 우수한 직원과 저조한 직원을 식별하여 밸런스를 진단하세요.
      - 향후 부서 관리를 위한 핵심 제언을 1문장으로 작성하세요.
    `;
    
    const result = await callAIAPI(prompt);
    setDeptBriefing(result);
    setDeptBriefingLoading(false);
  };

  // ── Styles ──
  const sty = {
    page: { fontFamily:"'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif", background:"linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)", minHeight:"100vh", color:"#E2E8F0", padding:0, margin:0 },
    header: { background:"rgba(15,23,42,0.85)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(148,163,184,0.15)", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 },
    container: { maxWidth:1440, margin:"0 auto", padding:"24px 32px" },
    card: { background:"rgba(30,41,59,0.7)", borderRadius:16, border:"1px solid rgba(148,163,184,0.12)", backdropFilter:"blur(10px)", padding:24, marginBottom:20 },
    tab: (active) => ({ padding:"10px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:14, fontWeight:active ? 700 : 500, background: active ? "linear-gradient(135deg, #3B82F6, #2563EB)" : "transparent", color: active ? "#fff" : "#94A3B8", transition:"all 0.25s", marginRight:4 }),
    th: { padding:"12px 14px", textAlign:"left", fontSize:12, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.8, borderBottom:"2px solid rgba(148,163,184,0.15)", cursor:"pointer", userSelect:"none", whiteSpace:"nowrap" },
    td: { padding:"12px 14px", fontSize:14, borderBottom:"1px solid rgba(148,163,184,0.08)" },
    select: { background:"rgba(30,41,59,0.8)", border:"1px solid rgba(148,163,184,0.2)", borderRadius:8, color:"#E2E8F0", padding:"8px 12px", fontSize:13, outline:"none" },
    btn: { background:"linear-gradient(135deg, #3B82F6, #2563EB)", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:600 },
    aiBtn: { background:"linear-gradient(135deg, #8B5CF6, #6366F1)", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 },
    modal: { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 },
    modalContent: { background:"#1E293B", borderRadius:20, maxWidth:900, width:"100%", maxHeight:"85vh", overflow:"auto", border:"1px solid rgba(148,163,184,0.15)", boxShadow:"0 25px 50px rgba(0,0,0,0.5)" },
  };

  // ═════════════════════════
  // 📊 OVERVIEW TAB
  // ═════════════════════════
  const renderOverview = () => (
    <div>
      {/* KPI Cards */}
      <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        <KPICard icon="📊" title="4분기 평균 점수" value={kpis.avgScore.toFixed(1)} sub={`전분기 대비 ${(kpis.avgScore - kpis.q3Avg) >= 0 ? "+" : ""}${(kpis.avgScore - kpis.q3Avg).toFixed(1)}점`} borderColor="#3B82F6" />
        <KPICard icon="🏆" title="A등급 비율" value={`${kpis.aRatio}%`} sub={`${kpis.aCount}명 / ${kpis.total}명`} detail={`🏅 ${kpis.aNames}`} borderColor="#10B981" />
        <KPICard icon="📈" title="상승 추세" value={`${kpis.upCount}명`} sub="전분기 대비 상승자" detail={kpis.upNames ? `▲ ${kpis.upNames}` : "해당 없음"} borderColor="#F59E0B" />
        <KPICard icon="⚠️" title="이탈 위험" value={`${kpis.riskCount}명`} sub="High Risk 대상" detail={kpis.riskNames ? `⚠ ${kpis.riskNames}` : "해당 없음"} borderColor="#EF4444" />
      </div>

      {/* Grade Distribution Chart + Ranking */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20, alignItems:"start" }}>
        <div style={sty.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:"#F1F5F9" }}>📊 분기별 등급 분포 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gradeDistData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="label" tick={{ fill:"#94A3B8", fontSize:12 }} />
              <YAxis tick={{ fill:"#94A3B8", fontSize:12 }} allowDecimals={false} />
              <Tooltip content={<GradeDistTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, color:"#94A3B8" }} />
              <Bar dataKey="D" name="D등급" fill="#EF4444" stackId="stack" radius={[0,0,0,0]} />
              <Bar dataKey="C" name="C등급" fill="#F59E0B" stackId="stack" />
              <Bar dataKey="B" name="B등급" fill="#3B82F6" stackId="stack" />
              <Bar dataKey="A" name="A등급" fill="#10B981" stackId="stack" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={sty.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:"#F1F5F9" }}>🥇 2025 Q4 순위 분포</h3>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={getQ4Data().map(r => ({ name:r.name, score:r.score, grade:r.grade }))} layout="vertical" barSize={20} margin={{ left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis type="number" domain={[0,100]} tick={{ fill:"#94A3B8", fontSize:11 }} />
              <YAxis type="category" dataKey="name" width={65} tick={{ fill:"#E2E8F0", fontSize:12 }} interval={0} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="점수" radius={[0,6,6,0]}>
                {getQ4Data().map((r, i) => <Cell key={i} fill={GRADE_COLORS[r.grade]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Q4 Ranking Table */}
      <div style={sty.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:"#F1F5F9" }}>📋 2025년 4/4분기 인사평가 결과 (내림차순 정렬)</h3>
          <div style={{ display:"flex", gap:8 }}>
            <select style={sty.select} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="all">전체 부서</option>
              {getDepts().map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select style={sty.select} value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
              <option value="all">전체 등급</option>
              {["A","B","C","D"].map(g => <option key={g} value={g}>{g}등급</option>)}
            </select>
          </div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {[{k:"rank",l:"순위"},{k:"name",l:"이름"},{k:"department",l:"부서"},{k:"position",l:"직급"},{k:"score",l:"점수"},{k:"grade",l:"등급"},{k:"evaluator1",l:"1차평가자"},{k:"trend",l:"추세"},{k:"risk",l:"리스크"},{k:"avg",l:"전체평균"}].map(col => (
                  <th key={col.k} style={sty.th} onClick={() => handleSort(col.k)}>
                    {col.l} {sortKey === col.k ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                ))}
                <th style={sty.th}>AI 상세</th>
              </tr>
            </thead>
            <tbody>
              {q4Data.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(148,163,184,0.03)", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(148,163,184,0.03)"}>
                  <td style={{...sty.td, fontWeight:700, color:"#F59E0B", textAlign:"center"}}>{r.rank}</td>
                  <td style={{...sty.td, fontWeight:700, color:"#F1F5F9"}}>{r.name}</td>
                  <td style={sty.td}><span style={{ background:"rgba(59,130,246,0.15)", padding:"3px 10px", borderRadius:6, fontSize:12, color:"#93C5FD" }}>{r.department}</span></td>
                  <td style={sty.td}>{r.position}</td>
                  <td style={{...sty.td, fontWeight:800, fontSize:16, color: GRADE_COLORS[r.grade] }}>{r.score}</td>
                  <td style={sty.td}><GradeBadge grade={r.grade} /></td>
                  <td style={sty.td}>{r.evaluator1}</td>
                  <td style={sty.td}><TrendBadge trend={r.trend} /></td>
                  <td style={sty.td}><RiskBadge level={r.risk} /></td>
                  <td style={{...sty.td, fontSize:13, color:"#94A3B8"}}>{r.avg.toFixed(1)}</td>
                  <td style={sty.td}>
                    <button style={{...sty.btn, padding:"5px 12px", fontSize:12, display:"flex", alignItems:"center", gap:4}} onClick={() => setSelectedEmployee(r.name)}>
                      <Sparkles size={12} /> 분석
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ═════════════════════════
  // 📈 TREND TAB
  // ═════════════════════════
  const renderTrend = () => {
    const names = getUniqueNames();
    const chartData = PERIODS.map(p => {
      const row = { label: PERIOD_LABELS[p] };
      names.forEach(name => {
        const rec = RAW_DATA.find(r => r.period === p && r.name === name);
        row[name] = rec ? rec.score : null;
      });
      return row;
    });

    const lineColors = ["#10B981","#3B82F6","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#F97316","#84CC16","#6366F1","#14B8A6","#E879F9","#FB923C","#A3E635"];

    return (
      <div>
        <div style={sty.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:"#F1F5F9" }}>📈 전직원 분기별 성과 추이 (시계열 분석)</h3>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="label" tick={{ fill:"#94A3B8", fontSize:12 }} />
              <YAxis domain={[20, 100]} tick={{ fill:"#94A3B8", fontSize:12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="5 5" label={{ value:"B/C 경계(70)", fill:"#F59E0B", fontSize:11 }} />
              {names.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} name={name}
                  stroke={lineColors[i % lineColors.length]} strokeWidth={2}
                  dot={{ r:4, fill:lineColors[i % lineColors.length] }}
                  activeDot={{ r:6 }} connectNulls={true} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Individual Trend Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(420px, 1fr))", gap:16 }}>
          {getQ4Data().map((emp, idx) => {
            const hist = getEmployeeHistory(emp.name).filter(h => h.score !== null);
            return (
              <div key={idx} style={{...sty.card, cursor:"pointer", padding:20}} onClick={() => setSelectedEmployee(emp.name)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <GradeBadge grade={emp.grade} />
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:"#F1F5F9" }}>{emp.name}</div>
                      <div style={{ fontSize:12, color:"#94A3B8" }}>{emp.department} · {emp.position}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:GRADE_COLORS[emp.grade] }}>{emp.score}</div>
                    <TrendBadge trend={calcTrend(emp.name)} />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <ComposedChart data={hist.map(h => ({ label: PERIOD_LABELS[h.period], score: h.score }))}>
                    <defs>
                      <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GRADE_COLORS[emp.grade]} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={GRADE_COLORS[emp.grade]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fill:"#64748B", fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[20,100]} hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="score" fill={`url(#grad-${idx})`} stroke="none" />
                    <Line type="monotone" dataKey="score" name="점수" stroke={GRADE_COLORS[emp.grade]} strokeWidth={2.5} dot={{ r:4, fill:GRADE_COLORS[emp.grade], strokeWidth:2, stroke:"#1E293B" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ═════════════════════════
  // 💬 FEEDBACK TAB
  // ═════════════════════════
  const renderFeedback = () => {
    const q4 = getQ4Data();
    return (
      <div>
        <div style={sty.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:"#F1F5F9" }}>💬 2025 Q4 평가자별 피드백 조회</h3>
          <p style={{ fontSize:13, color:"#94A3B8", marginBottom:20 }}>각 직원의 1차·2차 평가자 피드백을 확인할 수 있습니다. 카드를 클릭하면 전체 이력을 볼 수 있습니다.</p>
        </div>
        
        {q4.map((emp, i) => (
          <div key={i} style={{...sty.card, marginBottom:16, cursor:"pointer"}} onClick={() => setSelectedEmployee(emp.name)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <GradeBadge grade={emp.grade} />
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#F1F5F9" }}>{emp.name} <span style={{ color:"#64748B", fontWeight:400, fontSize:13 }}>({emp.department} · {emp.position})</span></div>
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>1차평가자: {emp.evaluator1}{emp.evaluator2 ? ` | 2차평가자: ${emp.evaluator2}` : ""}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:24, fontWeight:800, color:GRADE_COLORS[emp.grade] }}>{emp.score}</span>
                <span style={{ fontSize:13, color:"#64748B", marginLeft:4 }}>점</span>
                <div style={{ fontSize:12, color:"#94A3B8" }}>순위 {emp.rank}위</div>
              </div>
            </div>
            
            {emp.feedback1 && (
              <div style={{ background:"rgba(59,130,246,0.06)", borderRadius:12, padding:16, marginBottom: emp.feedback2 ? 10 : 0, borderLeft:"3px solid #3B82F6" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#60A5FA", marginBottom:6 }}>📝 1차 평가자 피드백 ({emp.evaluator1})</div>
                <div style={{ fontSize:13, color:"#CBD5E1", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{emp.feedback1}</div>
              </div>
            )}
            {emp.feedback2 && (
              <div style={{ background:"rgba(16,185,129,0.06)", borderRadius:12, padding:16, borderLeft:"3px solid #10B981" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#34D399", marginBottom:6 }}>📝 2차 평가자 피드백 ({emp.evaluator2})</div>
                <div style={{ fontSize:13, color:"#CBD5E1", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{emp.feedback2}</div>
              </div>
            )}
            {!emp.feedback1 && !emp.feedback2 && (
              <div style={{ color:"#64748B", fontSize:13, fontStyle:"italic" }}>피드백 데이터 없음</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ═════════════════════════
  // 🔮 INSIGHT TAB
  // ═════════════════════════
  const renderInsight = () => {
    const q4 = getQ4Data().map(r => ({
      ...r,
      trend: calcTrend(r.name),
      risk: calcRisk(r.name),
      avg: calcAvg(r.name),
      insight: generateInsight(r.name),
      history: getEmployeeHistory(r.name).filter(h => h.score !== null)
    }));

    const topPerformers = q4.filter(r => r.grade === "A");
    const atRisk = q4.filter(r => r.risk === "High" || r.grade === "D");
    const rising = q4.filter(r => r.trend === "up");
    const declining = q4.filter(r => r.trend === "down");

    return (
      <div>
        <div style={sty.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8, color:"#F1F5F9" }}>🔮 데이터 기반 인사 인사이트 & 예측</h3>
          <p style={{ fontSize:13, color:"#94A3B8" }}>6개 분기(2024 Q3 ~ 2025 Q4) 데이터를 분석하여 도출된 전략적 인사이트입니다.</p>
        </div>

        {/* Summary Insight Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          <div style={{...sty.card, borderLeft:"4px solid #10B981"}}>
            <div style={{ fontSize:14, fontWeight:700, color:"#10B981", marginBottom:8 }}>🏆 Top Performers ({topPerformers.length}명)</div>
            {topPerformers.map(p => (
              <div key={p.name} style={{ fontSize:13, color:"#CBD5E1", marginBottom:4 }}>
                <b>{p.name}</b> ({p.score}점) — {p.insight.split(".")[0]}.
              </div>
            ))}
          </div>
          <div style={{...sty.card, borderLeft:"4px solid #EF4444"}}>
            <div style={{ fontSize:14, fontWeight:700, color:"#EF4444", marginBottom:8 }}>⚠️ 주의 대상 ({atRisk.length}명)</div>
            {atRisk.map(p => (
              <div key={p.name} style={{ fontSize:13, color:"#CBD5E1", marginBottom:4 }}>
                <b>{p.name}</b> ({p.score}점, {p.grade}등급) — <RiskBadge level={p.risk} />
              </div>
            ))}
          </div>
          <div style={{...sty.card, borderLeft:"4px solid #22C55E"}}>
            <div style={{ fontSize:14, fontWeight:700, color:"#22C55E", marginBottom:8 }}>📈 상승 추세 ({rising.length}명)</div>
            {rising.length ? rising.map(p => (
              <div key={p.name} style={{ fontSize:13, color:"#CBD5E1", marginBottom:4 }}>
                <b>{p.name}</b> — 전분기 대비 +{(p.score - (p.history.length >= 2 ? p.history[p.history.length-2].score : p.score)).toFixed(1)}점
              </div>
            )) : <div style={{ fontSize:13, color:"#64748B" }}>해당 인원 없음</div>}
          </div>
          <div style={{...sty.card, borderLeft:"4px solid #F97316"}}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F97316", marginBottom:8 }}>📉 하락 추세 ({declining.length}명)</div>
            {declining.length ? declining.map(p => (
              <div key={p.name} style={{ fontSize:13, color:"#CBD5E1", marginBottom:4 }}>
                <b>{p.name}</b> — 전분기 대비 {(p.score - (p.history.length >= 2 ? p.history[p.history.length-2].score : p.score)).toFixed(1)}점
              </div>
            )) : <div style={{ fontSize:13, color:"#64748B" }}>해당 인원 없음</div>}
          </div>
        </div>

        {/* Individual Insights */}
        <div style={sty.card}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:"#F1F5F9" }}>👤 개인별 상세 인사이트</h3>
          {q4.map((emp, i) => (
            <div key={i} style={{ display:"flex", gap:16, alignItems:"flex-start", padding:"14px 0", borderBottom: i < q4.length-1 ? "1px solid rgba(148,163,184,0.08)" : "none" }}>
              <GradeBadge grade={emp.grade} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:"#F1F5F9" }}>{emp.name} <span style={{ color:"#64748B", fontWeight:400 }}>({emp.department})</span></span>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ color:GRADE_COLORS[emp.grade], fontWeight:800 }}>{emp.score}점</span>
                    <TrendBadge trend={emp.trend} />
                    <RiskBadge level={emp.risk} />
                    <button onClick={() => setSelectedEmployee(emp.name)} style={{ background:"none", border:"none", cursor:"pointer", color:"#3B82F6", fontSize:12, fontWeight:600 }}>상세보기</button>
                  </div>
                </div>
                <div style={{ fontSize:13, color:"#94A3B8", lineHeight:1.7 }}>{emp.insight}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ═════════════════════════
  // 📋 DEPARTMENT TAB
  // ═════════════════════════
  const renderDeptAnalysis = () => {
    const depts = getDepts();
    const deptData = depts.map(d => {
      const members = getQ4Data().filter(r => r.department === d);
      const avgScore = members.reduce((s,r) => s+r.score, 0) / members.length;
      return {
        name: d,
        count: members.length,
        avgScore: avgScore,
        A: members.filter(r => r.grade === "A").length,
        B: members.filter(r => r.grade === "B").length,
        C: members.filter(r => r.grade === "C").length,
        D: members.filter(r => r.grade === "D").length,
        members
      };
    });

    // Department trend over time
    const deptTrendData = PERIODS.map(p => {
      const row = { label: PERIOD_LABELS[p] };
      depts.forEach(d => {
        const recs = RAW_DATA.filter(r => r.period === p && r.department === d);
        row[d] = recs.length ? (recs.reduce((s,r) => s+r.score, 0) / recs.length) : null;
      });
      return row;
    });

    const deptColors = { "마케팅":"#EC4899", "운영지원부":"#06B6D4", "BSP":"#8B5CF6", "대외협력센터":"#F97316" };

    return (
      <div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
          <div style={sty.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:"#F1F5F9" }}>🏢 부서별 평균 점수</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" tick={{ fill:"#94A3B8", fontSize:12 }} />
                <YAxis domain={[0,100]} tick={{ fill:"#94A3B8", fontSize:12 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="5 5" />
                <Bar dataKey="avgScore" name="평균점수" radius={[6,6,0,0]}>
                  {deptData.map((d, i) => <Cell key={i} fill={deptColors[d.name] || "#6366F1"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={sty.card}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:"#F1F5F9" }}>📈 부서별 분기 추이</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={deptTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" tick={{ fill:"#94A3B8", fontSize:12 }} />
                <YAxis domain={[30,100]} tick={{ fill:"#94A3B8", fontSize:12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                {depts.map(d => (
                  <Line key={d} type="monotone" dataKey={d} name={d}
                    stroke={deptColors[d] || "#6366F1"} strokeWidth={2.5}
                    dot={{ r:4 }} connectNulls={true} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Detail Cards */}
        {deptData.map((dept, i) => (
          <div key={i} style={{...sty.card, marginBottom:16}}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:deptColors[dept.name] || "#F1F5F9", margin:0 }}>
                  {dept.name} ({dept.count}명)
                </h3>
                {deptBriefing ? null : (
                    <button 
                      onClick={() => handleDeptBriefing(dept.name)}
                      disabled={deptBriefingLoading}
                      style={{ ...sty.aiBtn, padding: "4px 10px", fontSize: 11 }}
                    >
                      {deptBriefingLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      AI 브리핑
                    </button>
                  )}
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:"#F1F5F9" }}>{dept.avgScore.toFixed(1)}점</div>
            </div>
            
            {/* AI Department Briefing Result */}
            {deptBriefing && deptBriefing.includes(dept.name) && (
              <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                 <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <div style={{ fontWeight: 700, color: "#A78BFA", marginBottom: 6, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={14} /> AI 경영진 브리핑
                    </div>
                    <button onClick={() => setDeptBriefing(null)} style={{ background:"none", border:"none", color:"#94A3B8", cursor:"pointer" }}><X size={14} /></button>
                 </div>
                 <div style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{deptBriefing}</div>
              </div>
            )}

            <div style={{ display:"flex", gap:16, marginBottom:12, flexWrap:"wrap" }}>
              {["A","B","C","D"].map(g => (
                <div key={g} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <GradeBadge grade={g} />
                  <span style={{ fontSize:13, color:"#94A3B8" }}>{dept[g]}명</span>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
              {dept.members.sort((a,b) => a.rank - b.rank).map((m, j) => (
                <div key={j} style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:12, cursor:"pointer", borderLeft:`3px solid ${GRADE_COLORS[m.grade]}` }}
                  onClick={() => setSelectedEmployee(m.name)}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#F1F5F9" }}>{m.name}</div>
                  <div style={{ fontSize:13, color:GRADE_COLORS[m.grade], fontWeight:700 }}>{m.score}점 ({m.grade}) · #{m.rank}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ═════════════════════════
  // 🔍 EMPLOYEE DETAIL MODAL
  // ═════════════════════════
  const renderModal = () => {
    if (!selectedEmployee) return null;
    const history = getEmployeeHistory(selectedEmployee);
    const validHistory = history.filter(h => h.score !== null);
    const latest = RAW_DATA.filter(r => r.name === selectedEmployee).sort((a,b) => b.period.localeCompare(a.period))[0];
    const trend = calcTrend(selectedEmployee);
    const risk = calcRisk(selectedEmployee);
    const avg = calcAvg(selectedEmployee);
    const insight = generateInsight(selectedEmployee);

    // All feedbacks across periods
    const allFeedbacks = RAW_DATA.filter(r => r.name === selectedEmployee && (r.feedback1 || r.feedback2))
      .sort((a,b) => b.period.localeCompare(a.period));

    return (
      <div style={sty.modal} onClick={() => { setSelectedEmployee(null); setAiAnalysis(null); setEmailDraft(null); }}>
        <div style={sty.modalContent} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div style={{ padding:"24px 28px", borderBottom:"1px solid rgba(148,163,184,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <GradeBadge grade={latest?.grade} />
              <div>
                <h2 style={{ fontSize:22, fontWeight:800, color:"#F1F5F9", margin:0 }}>{selectedEmployee}</h2>
                <div style={{ fontSize:13, color:"#94A3B8" }}>{latest?.department} · {latest?.position} · 1차평가자: {latest?.evaluator1}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:32, fontWeight:800, color:GRADE_COLORS[latest?.grade] }}>{latest?.score}</div>
                <div style={{ fontSize:12, color:"#94A3B8" }}>2025 Q4 · 순위 {latest?.rank}위</div>
              </div>
              <button onClick={() => { setSelectedEmployee(null); setAiAnalysis(null); setEmailDraft(null); }} style={{ background:"none", border:"none", color:"#94A3B8", fontSize:28, cursor:"pointer", padding:4 }}>✕</button>
            </div>
          </div>

          <div style={{ padding:"24px 28px" }}>
            {/* Stats Row */}
            <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
              <div style={{ background:"rgba(59,130,246,0.1)", padding:"10px 16px", borderRadius:10, flex:1, minWidth:120 }}>
                <div style={{ fontSize:11, color:"#60A5FA", fontWeight:600 }}>전체 평균</div>
                <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>{avg.toFixed(1)}</div>
              </div>
              <div style={{ background:"rgba(16,185,129,0.1)", padding:"10px 16px", borderRadius:10, flex:1, minWidth:120 }}>
                <div style={{ fontSize:11, color:"#34D399", fontWeight:600 }}>추세</div>
                <div style={{ fontSize:20 }}><TrendBadge trend={trend} /> <span style={{ fontSize:14, color:"#94A3B8" }}>{trend === "up" ? "상승" : trend === "down" ? "하락" : "유지"}</span></div>
              </div>
              <div style={{ background: risk === "High" ? "rgba(239,68,68,0.1)" : risk === "Medium" ? "rgba(249,115,22,0.1)" : "rgba(132,204,22,0.1)", padding:"10px 16px", borderRadius:10, flex:1, minWidth:120 }}>
                <div style={{ fontSize:11, color:RISK_COLORS[risk], fontWeight:600 }}>리스크</div>
                <div><RiskBadge level={risk} /></div>
              </div>
              <div style={{ background:"rgba(139,92,246,0.1)", padding:"10px 16px", borderRadius:10, flex:1, minWidth:120 }}>
                <div style={{ fontSize:11, color:"#A78BFA", fontWeight:600 }}>평가 횟수</div>
                <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>{validHistory.length}회</div>
              </div>
            </div>

            {/* AI Action Buttons */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <button 
                onClick={() => handleAIAnalysis(selectedEmployee)}
                disabled={aiLoading}
                style={sty.aiBtn}
              >
                {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                AI 성과 코칭 리포트 생성
              </button>
              <button 
                onClick={() => handleEmailDraft(selectedEmployee)}
                disabled={emailLoading}
                style={{ ...sty.aiBtn, background: "linear-gradient(135deg, #10B981, #059669)" }}
              >
                {emailLoading ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                피드백 메일 초안 작성
              </button>
            </div>

            {/* AI Analysis Result */}
            {aiAnalysis && (
              <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 14, padding: 20, marginBottom: 20, animation: "fadeIn 0.3s" }}>
                <div style={{ fontWeight: 700, color: "#A78BFA", marginBottom: 10, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={18} /> AI 성과 분석 및 코칭 가이드
                </div>
                <div style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>
              </div>
            )}

            {/* Email Draft Result */}
            {emailDraft && (
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: 20, marginBottom: 20, animation: "fadeIn 0.3s" }}>
                <div style={{ fontWeight: 700, color: "#34D399", marginBottom: 10, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={18} /> AI 피드백 메일 초안
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 8, fontSize: 13, color: "#E2E8F0", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                  {emailDraft}
                </div>
              </div>
            )}

            {/* Trend Chart */}
            <div style={{ background:"rgba(0,0,0,0.15)", borderRadius:14, padding:20, marginBottom:20 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>📈 분기별 성과 추이</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={history.map(h => ({ label: h.label, score: h.score, grade: h.grade }))}>
                  <defs>
                    <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="label" tick={{ fill:"#94A3B8", fontSize:12 }} />
                  <YAxis domain={[20,100]} tick={{ fill:"#94A3B8", fontSize:12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="5 5" />
                  <ReferenceLine y={80} stroke="#10B981" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="score" fill="url(#modalGrad)" stroke="none" />
                  <Line type="monotone" dataKey="score" name="점수" stroke="#3B82F6" strokeWidth={3} dot={{ r:6, fill:"#3B82F6", strokeWidth:3, stroke:"#1E293B" }} connectNulls={true} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Score History Table */}
            <div style={{ background:"rgba(0,0,0,0.15)", borderRadius:14, padding:20, marginBottom:20 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>📊 평가 이력 (내림차순)</h3>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {["분기","점수","등급","순위","평가방식","1차평가자","변동"].map(h => (
                      <th key={h} style={sty.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...validHistory].reverse().map((h, i, arr) => {
                    const prev = arr[i+1];
                    const diff = prev ? (h.score - prev.score) : null;
                    return (
                      <tr key={i} style={{ background: i === 0 ? "rgba(59,130,246,0.08)" : "transparent" }}>
                        <td style={{...sty.td, fontWeight:700}}>{h.label}</td>
                        <td style={{...sty.td, fontWeight:800, color:GRADE_COLORS[h.grade]}}>{h.score}</td>
                        <td style={sty.td}><GradeBadge grade={h.grade} /></td>
                        <td style={sty.td}>{h.rank}위</td>
                        <td style={{...sty.td, fontSize:12}}>{h.method || "-"}</td>
                        <td style={sty.td}>{h.evaluator1 || "-"}</td>
                        <td style={sty.td}>
                          {diff !== null ? (
                            <span style={{ color: diff > 0 ? "#22C55E" : diff < 0 ? "#EF4444" : "#6B7280", fontWeight:700 }}>
                              {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                            </span>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Feedbacks */}
            {allFeedbacks.length > 0 && (
              <div style={{ background:"rgba(0,0,0,0.15)", borderRadius:14, padding:20, marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>💬 평가 피드백 이력</h3>
                {allFeedbacks.map((fb, i) => (
                  <div key={i} style={{ marginBottom:16, borderLeft:`3px solid ${GRADE_COLORS[fb.grade]}`, paddingLeft:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:GRADE_COLORS[fb.grade], marginBottom:6 }}>
                      {PERIOD_LABELS[fb.period]} · {fb.score}점 ({fb.grade}등급)
                    </div>
                    {fb.feedback1 && (
                      <div style={{ background:"rgba(59,130,246,0.05)", borderRadius:8, padding:12, marginBottom:8 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#60A5FA", marginBottom:4 }}>1차 평가자 ({fb.evaluator1})</div>
                        <div style={{ fontSize:13, color:"#CBD5E1", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{fb.feedback1}</div>
                      </div>
                    )}
                    {fb.feedback2 && (
                      <div style={{ background:"rgba(16,185,129,0.05)", borderRadius:8, padding:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#34D399", marginBottom:4 }}>2차 평가자 ({fb.evaluator2})</div>
                        <div style={{ fontSize:13, color:"#CBD5E1", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{fb.feedback2}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Deterministic Insight */}
            <div style={{ background:"linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))", borderRadius:14, padding:20, border:"1px solid rgba(99,102,241,0.2)" }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#A78BFA", marginBottom:8 }}>🔮 요약 인사이트</h3>
              <p style={{ fontSize:13, color:"#CBD5E1", lineHeight:1.8, margin:0 }}>{insight}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═════════════════════════
  // 🏗️ MAIN RENDER
  // ═════════════════════════
  const tabs = [
    { id:"overview", label:"📊 평가 총괄", desc:"Q4 결과 & 순위" },
    { id:"trend", label:"📈 시계열 분석", desc:"분기별 추이" },
    { id:"feedback", label:"💬 피드백 조회", desc:"평가자별 피드백" },
    { id:"insight", label:"🔮 인사이트", desc:"예측 & 전략" },
    { id:"department", label:"🏢 부서 분석", desc:"부서별 비교" },
  ];

  return (
    <div style={sty.page}>
      {/* Header */}
      <header style={sty.header}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* 로고 영역: 이미지로 교체됨 */}
          <img 
            src="/logo.png" // ⚠️ 여기에 첨부하신 로고 파일 경로를 입력해주세요 (예: logo.png)
            alt="기업의별 로고" 
            style={{ height: 48, width: "auto", objectFit: "contain" }} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex'; // Show fallback
            }}
          />
          {/* Fallback if image fails */}
          <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg, #3B82F6, #8B5CF6)", display:"none", alignItems:"center", justifyContent:"center", color:"#fff", boxShadow:"0 4px 6px rgba(59, 130, 246, 0.3)" }}>
            <Star fill="currentColor" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", margin:0, letterSpacing:-0.5 }}>기업의별 HR 전략 대시보드</h1>
            <div style={{ fontSize:12, color:"#64748B" }}>2025년 4/4분기 인사평가 결과 · 14명 · 3개 부서</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button
            type="button"
            onClick={() => setShowAiSettings(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.25)",
              background: hasAiApiKey() ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
              color: hasAiApiKey() ? "#34D399" : "#F59E0B",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
            title="AI 분석에 사용할 API 키를 설정합니다"
          >
            <Settings size={18} />
            AI API 설정
          </button>
          <span style={{ background:"rgba(16,185,129,0.15)", color:"#34D399", padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700 }}>2025 Q4 최신</span>
          <span style={{ fontSize:12, color:"#64748B" }}>평가기간: 2025.12.31</span>
        </div>
      </header>

      {/* AI API 환경설정 모달 */}
      {showAiSettings && (
        <div style={sty.modal} onClick={() => setShowAiSettings(false)}>
          <div
            style={sty.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(148,163,184,0.15)" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                <Settings size={22} /> AI API 환경설정
              </h2>
              <button type="button" onClick={() => setShowAiSettings(false)} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 24, cursor: "pointer", padding: 4 }}>×</button>
            </div>
            <AiApiSettingsForm
              onSave={() => setShowAiSettings(false)}
              onCancel={() => setShowAiSettings(false)}
            />
          </div>
        </div>
      )}

      <div style={sty.container}>
        {/* Tab Navigation */}
        <div style={{ display:"flex", gap:4, marginBottom:24, background:"rgba(30,41,59,0.5)", padding:6, borderRadius:14, flexWrap:"wrap" }}>
          {tabs.map(t => (
            <button key={t.id} style={sty.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "trend" && renderTrend()}
        {activeTab === "feedback" && renderFeedback()}
        {activeTab === "insight" && renderInsight()}
        {activeTab === "department" && renderDeptAnalysis()}
      </div>

      {/* Employee Detail Modal */}
      {renderModal()}

      {/* Footer */}
      <footer style={{ textAlign:"center", padding:"32px 0 24px", borderTop:"1px solid rgba(148,163,184,0.08)", marginTop:32 }}>
        <div style={{ fontSize:12, color:"#475569" }}>
          기업의별 HR 전략 대시보드 · 데이터 기반: 2024 Q3 ~ 2025 Q4 (6개 분기, 77건) · 모든 수치는 원본 CSV/XLSX 기반
        </div>
      </footer>
    </div>
  );
}