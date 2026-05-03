import { useState, useCallback, useRef, useEffect } from "react";
import type {
  Message,
  ApiConfig,
  ActionType,
  RawMessage,
  AttachedFile,
} from "../types";
import { sendMessage, fetchChatHistory, clearHistory } from "../services/api";

const LIMIT = 20;

function parseRawMessage(raw: RawMessage): Message {
  return {
    id: String(raw.id),
    role: raw.type,
    content: raw.content ?? "",
    action: (raw.action as ActionType) ?? undefined,
    timestamp: raw.timestamp ? raw.timestamp : Date.now(),
    files: raw.files?.map((value) => ({ name: value, content: "", size: 0 })),
  };
}

export function useChatSession(sessionId: string, config: ApiConfig) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const loadedRef = useRef(false);

  const readyRef = useRef<Promise<void>>(Promise.resolve());
  const readyResolveRef = useRef<() => void>(() => {});

  useEffect(() => {
    let resolve!: () => void;
    readyRef.current = new Promise<void>((r) => {
      resolve = r;
    });
    readyResolveRef.current = resolve;
  }, []); // только при маунте

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Очищаем при размонтировании
  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPolling = useCallback(() => {
    if (pollRef.current || !config.baseUrl || !config.apiKey) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetchChatHistory(config, sessionId, 1, LIMIT);
        const loaded = res.data.map(parseRawMessage).reverse();
        const last = loaded[loaded.length - 1];
        if (last?.role === "ai") {
          setMessages(loaded);
          setIsLoading(false);
          stopPolling();
        }
      } catch {
        // игнорируем ошибки поллинга
      }
    }, 2000);
  }, [config, sessionId, stopPolling]);

  const loadInitialHistory = useCallback(async () => {
    if (loadedRef.current) return;

    if (!config.baseUrl || !config.apiKey) {
      loadedRef.current = true;
      setHasMore(false);
      return;
    }

    loadedRef.current = true;
    setIsLoadingHistory(true);
    try {
      const res = await fetchChatHistory(config, sessionId, 1, LIMIT);
      pageRef.current = 1;
      setHasMore(res.total_returned === LIMIT);
      setMessages((prev) =>
        prev.length > 0 ? prev : res.data.map(parseRawMessage).reverse(),
      );

      const parsed = res.data.map(parseRawMessage).reverse();
      const last = parsed[parsed.length - 1];

      if (last?.role === "human") {
        // AI ещё не ответил — показываем typing и ждём
        setMessages([
          ...parsed,
          { id: "typing", role: "ai", content: "", timestamp: Date.now() },
        ]);
        setIsLoading(true);
      } else {
        setMessages(parsed);
      }
    } catch (e) {
      loadedRef.current = false;
      console.warn("История не загружена:", e instanceof Error ? e.message : e);
    } finally {
      stopPolling();
      setIsLoading(false);
      setIsLoadingHistory(false);
      readyResolveRef.current();
    }
  }, [config, sessionId, stopPolling]);

  useEffect(() => {
    const last = messages.filter((m) => m.id !== "typing").at(-1);
    if (last?.role === "human" && config.baseUrl && config.apiKey) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [messages, config, startPolling, stopPolling]);

  const loadMoreHistory = useCallback(async () => {
    if (isLoadingHistory || !hasMore) return;
    setIsLoadingHistory(true);
    const nextPage = pageRef.current + 1;
    try {
      const res = await fetchChatHistory(config, sessionId, nextPage, LIMIT);
      setHasMore(res.total_returned === LIMIT);
      pageRef.current = nextPage;
      setMessages((prev) => [
        ...res.data.map(parseRawMessage).reverse(),
        ...prev,
      ]);
    } catch (e) {
      console.warn("Ошибка подгрузки:", e instanceof Error ? e.message : e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [config, sessionId, isLoadingHistory, hasMore]);

  const send = useCallback(
    async (
      text: string,
      action: ActionType = "chat",
      code?: string,
      language?: string,
      files?: AttachedFile[],
    ) => {
      if (!text.trim() && !code && (!files || files.length === 0)) return;

      if (!config.baseUrl || !config.apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ai",
            content:
              "> ⚠️ Сначала укажите **URL сервера** и **API-ключ** в настройках (⚙️ внизу слева).",
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "human",
        action,
        content: text,
        timestamp: Date.now(),
        files,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const placeholder: Message = {
        id: "typing",
        role: "ai",
        content: "",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, placeholder]);

      // chat → поле message, остальные → поле code
      const payload =
        action === "chat"
          ? {
              action,
              message: text,
              sessionId,
              files: files?.map((f) => ({ name: f.name, content: f.content })),
            }
          : {
              action,
              code: text,
              language,
              sessionId,
              files: files?.map((f) => ({ name: f.name, content: f.content })),
            };

      try {
        const res = await sendMessage(config, payload);
        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: "ai",
          content: res.data?.content ?? "",
          timestamp: Date.now(),
        };
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "typing"),
          aiMsg,
        ]);
      } catch (e) {
        const errMsg: Message = {
          id: crypto.randomUUID(),
          role: "ai",
          content: `> ⚠️ **Ошибка:** ${e instanceof Error ? e.message : "Что-то пошло не так"}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "typing"),
          errMsg,
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [config, sessionId],
  );

  const clearChat = useCallback(async () => {
    stopPolling();
    try {
      if (config.baseUrl && config.apiKey) {
        await clearHistory(config, sessionId);
      }
      setMessages([]);
      loadedRef.current = true;
      pageRef.current = 1;
      setHasMore(false);
      setIsLoadingHistory(false);
    } catch (e) {
      console.warn("Ошибка очистки:", e instanceof Error ? e.message : e);
    }
  }, [config, sessionId, stopPolling]);

  const resetLocalState = useCallback(() => {
    setMessages([]);
    loadedRef.current = false;
    pageRef.current = 1;
    setHasMore(true);
  }, []);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    hasMore,
    loadInitialHistory,
    loadMoreHistory,
    send,
    clearChat,
    resetLocalState,
    waitReady: () => readyRef.current,
  };
}
