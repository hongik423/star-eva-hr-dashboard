/**
 * AI API 호출 (환경설정 기반)
 * @encoding UTF-8
 */

import { getAiApiConfig } from './aiApiConfig.js';

const NO_KEY_MESSAGE = 'AI API 키가 설정되지 않았습니다. 상단 "AI API 설정"에서 API 키를 입력해 주세요.';

/** HTTP 상태별 사용자 안내 메시지 */
function userMessageForStatus(status, detail) {
  switch (status) {
    case 429:
      return 'API 사용 한도를 초과했습니다. Google AI Studio(https://ai.google.dev)에서 요금제·사용량을 확인하거나, 잠시 후 다시 시도해 주세요.';
    case 401:
      return 'API 키가 유효하지 않습니다. "AI API 설정"에서 키를 확인해 주세요.';
    case 403:
      return 'API 접근이 거부되었습니다. API 키 권한 및 사용 가능 모델을 확인해 주세요.';
    case 404:
      return '요청한 모델을 찾을 수 없습니다. "AI API 설정"에서 모델명(예: gemini-2.5-flash-preview-09-2025)을 확인해 주세요.';
    case 400:
      return detail || '요청 형식 오류입니다. 모델명과 API 키를 확인해 주세요.';
    case 500:
    case 502:
    case 503:
      return 'Google AI 서버 일시 오류입니다. 잠시 후 다시 시도해 주세요.';
    default:
      return detail ? `오류 (${status}): ${detail}` : `API 오류가 발생했습니다. (코드: ${status})`;
  }
}

/**
 * 저장된 설정으로 AI API 호출 (Gemini)
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function callAIAPI(prompt) {
  const { apiKey, model } = getAiApiConfig();
  const key = (apiKey || '').trim();
  if (!key) return NO_KEY_MESSAGE;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let detail = '';
      try {
        const errJson = JSON.parse(errText);
        detail = errJson?.error?.message || errText.slice(0, 150);
      } catch {
        detail = errText.slice(0, 150);
      }
      const message = userMessageForStatus(response.status, detail);
      console.error('AI API Error:', response.status, errText.slice(0, 300));
      return message;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('AI API Call Failed:', error);
    if (error.message && error.message.includes('API Error')) {
      return '네트워크 또는 API 연결에 실패했습니다. 연결을 확인한 뒤 다시 시도해 주세요.';
    }
    return '현재 AI 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  }
}
