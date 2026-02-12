/**
 * AI API 환경설정 저장/조회 (localStorage)
 * @encoding UTF-8
 */

const STORAGE_KEY = 'hr_dashboard_ai_api_config';

const DEFAULT = {
  apiKey: '',
  provider: 'gemini',
  model: 'gemini-2.5-flash-preview-09-2025',
};

export function getAiApiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey ?? DEFAULT.apiKey,
      provider: parsed.provider ?? DEFAULT.provider,
      model: parsed.model ?? DEFAULT.model,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function setAiApiConfig({ apiKey, provider, model }) {
  try {
    const next = {
      apiKey: typeof apiKey === 'string' ? apiKey : getAiApiConfig().apiKey,
      provider: provider ?? getAiApiConfig().provider,
      model: model ?? getAiApiConfig().model,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (e) {
    console.error('setAiApiConfig failed', e);
    return getAiApiConfig();
  }
}

export function hasAiApiKey() {
  const key = getAiApiConfig().apiKey;
  return typeof key === 'string' && key.trim().length > 0;
}
