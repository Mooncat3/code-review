import type { ApiConfig, ActionType, RawMessage } from "../types";

interface SendMessagePayload {
  action: ActionType | "delete";
  message?: string;
  code?: string;
  language?: string;
  sessionId: string;
  files?: Array<{ name: string; content: string }>;
}

interface SendMessageResponse {
  status: string;
  data: { format: string; content: string };
}

interface ChatHistoryResponse {
  success: boolean;
  page: number;
  limit: number;
  total_returned: number;
  data: RawMessage[];
}

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? `Некорректный ответ сервера (ожидался JSON)`
        : `HTTP ${res.status}: сервер вернул не JSON — проверьте URL и API-ключ`,
    );
  }
}

export async function sendMessage(
  config: ApiConfig,
  payload: SendMessagePayload,
): Promise<SendMessageResponse> {
  const res = await fetch(`${config.baseUrl}/webhook/api/ollama`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  return safeJson<SendMessageResponse>(res);
}

export async function fetchChatHistory(
  config: ApiConfig,
  sessionId: string,
  page = 1,
  limit = 20,
): Promise<ChatHistoryResponse> {
  const params = new URLSearchParams({
    sessionId,
    page: String(page),
    limit: String(limit),
  });

  const res = await fetch(
    `${config.baseUrl}/webhook/api/chat-history?${params}`,
    { headers: { Authorization: `Bearer ${config.apiKey}` } },
  );

  return safeJson<ChatHistoryResponse>(res);
}

export async function clearHistory(
  config: ApiConfig,
  sessionId: string,
): Promise<void> {
  const res = await fetch(`${config.baseUrl}/webhook/api/ollama`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ action: "delete", sessionId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
  }
}
