/// <reference types="chrome" />
import { useState, useCallback, useEffect, useRef } from "react";
import type { ApiConfig, ActionType, AttachedFile } from "../types";
import { useChatSession } from "../hooks/useChatSession";
import { MessageBubble } from "../components/MessageBubble";
import { ChatInput } from "../components/ChatInput";
import { ConfirmModal } from "../components/ConfirmModal";
import { SettingsModal } from "../components/SettingsModal";
import "../styles/chat.css";
import "../styles/input.css";
import "../styles/modal.css";
import "./panel.css";
import { MAX_FILE_SIZE_KB, MAX_FILES, readFiles } from "../utils/files";

const CONFIG_KEY = "ai_agent_config";

async function buildSessionId(host: string): Promise<string> {
  const clean = host.replace(/^www\./, "") || "local";
  const result = await chrome.storage.local.get("userId");
  const userId: string = result.userId ?? "default";
  const encoder = new TextEncoder();
  const data = encoder.encode(`${userId}:${clean}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${clean}###${hashHex.slice(0, 64)}`;
}

export function Panel() {
  const [config, setConfig] = useState<ApiConfig>({
    baseUrl: "",
    apiKey: "",
  });
  const [configLoaded, setConfigLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(CONFIG_KEY).then((result) => {
      if (result[CONFIG_KEY]) {
        try {
          setConfig(JSON.parse(result[CONFIG_KEY]));
        } catch {
          // Игнорируем невалидный JSON в storage
        }
      }
      setConfigLoaded(true);
    });
  }, []);

  // При открытии панели
  useEffect(() => {
    chrome.storage.session.get("currentTabHost").then(async (result) => {
      const host = result.currentTabHost ?? "local";
      const sid = await buildSessionId(host);
      setSessionId(sid);
    });
  }, []);

  useEffect(() => {
    const listener = async (msg: { type: string; host: string }) => {
      if (msg.type === "TAB_CHANGED" && msg.host) {
        const sid = await buildSessionId(msg.host);
        setSessionId(sid);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleSaveConfig = useCallback((cfg: ApiConfig) => {
    setConfig(cfg);
    chrome.storage.local.set({ [CONFIG_KEY]: JSON.stringify(cfg) });
  }, []);

  if (!configLoaded || !sessionId) {
    return (
      <div className="panel">
        <div className="panel__header">
          <div className="panel__logo">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            AI Agent
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PanelInner
        key={sessionId}
        sessionId={sessionId}
        config={config}
        onSaveConfig={handleSaveConfig}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showClearConfirm={showClearConfirm}
        setShowClearConfirm={setShowClearConfirm}
      />
    </>
  );
}

interface InnerProps {
  sessionId: string;
  config: ApiConfig;
  onSaveConfig: (cfg: ApiConfig) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showClearConfirm: boolean;
  setShowClearConfirm: (v: boolean) => void;
}

function PanelInner({
  sessionId,
  config,
  onSaveConfig,
  showSettings,
  setShowSettings,
  showClearConfirm,
  setShowClearConfirm,
}: InnerProps) {
  const {
    messages,
    isLoading,
    isLoadingHistory,
    hasMore,
    loadInitialHistory,
    loadMoreHistory,
    send,
    clearChat,
    resetLocalState,
    waitReady,
  } = useChatSession(sessionId, config);

  // --- файлы и drag-and-drop (как в ChatWindow) ---
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (Array.from(e.dataTransfer.items).some((i) => i.kind === "file")) {
      dragCounterRef.current++;
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (!dropped.length) return;
    const { added } = await readFiles(dropped, files);
    if (added.length) setFiles((prev) => [...prev, ...added]);
  };
  // ---

  const reloadHistory = useCallback(async () => {
    resetLocalState();
    await loadInitialHistory();
  }, [resetLocalState, loadInitialHistory]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    loadInitialHistory();
  }, [loadInitialHistory]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom || isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const pendingHandledRef = useRef(false);

  useEffect(() => {
    const handlePending = async (action: ActionType, text: string) => {
      if (pendingHandledRef.current) return;
      pendingHandledRef.current = true;
      await chrome.storage.session.remove("pendingAction");
      if (text.trim()) {
        // Ждём завершения loadInitialHistory перед отправкой
        await waitReady();
        sendRef.current(text, action);
      }
      setTimeout(() => {
        pendingHandledRef.current = false;
      }, 500);
    };

    // Панель только открылась — проверяем storage сразу
    chrome.storage.session.get("pendingAction").then((result) => {
      if (result.pendingAction) {
        handlePending(result.pendingAction.action, result.pendingAction.text);
      }
    });

    // Панель уже была открыта — слушаем изменения storage
    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.pendingAction?.newValue) {
        const { action, text } = changes.pendingAction.newValue;
        handlePending(action, text);
      }
    };

    chrome.storage.session.onChanged.addListener(listener);
    return () => chrome.storage.session.onChanged.removeListener(listener);
  }, [waitReady]);

  const handleLoadMore = useCallback(async () => {
    const el = scrollRef.current;
    if (el) prevScrollHeightRef.current = el.scrollHeight;
    await loadMoreHistory();
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
    });
  }, [loadMoreHistory]);

  const handleSend = (
    text: string,
    action: ActionType,
    attachedFiles?: AttachedFile[],
  ) => {
    send(text, action, undefined, undefined, attachedFiles);
  };

  return (
    <div
      className="panel"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="panel__header">
        <div className="panel__logo">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          AI Agent
        </div>
        <div
          className="panel__session-host"
          title={`Сессия: ${sessionId.split("###")[0]}`}
        >
          {sessionId.split("###")[0]}
        </div>
        <div className="panel__actions">
          <button
            className="panel__icon-btn"
            onClick={reloadHistory}
            title="Обновить историю"
            aria-label="Обновить историю"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button
            className="panel__icon-btn"
            onClick={() => setShowClearConfirm(true)}
            title="Очистить историю"
            aria-label="Очистить историю"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
          <button
            className="panel__icon-btn"
            onClick={() => setShowSettings(true)}
            title="Настройки"
            aria-label="Настройки"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay__box">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <span>Перетащите файлы сюда</span>
            <span className="drag-overlay__hint">
              Текстовые форматы · до {MAX_FILE_SIZE_KB} KB · макс. {MAX_FILES}{" "}
              файлов
            </span>
          </div>
        </div>
      )}

      <div className="chat-messages panel__messages" ref={scrollRef}>
        {hasMore && (
          <div className="chat-messages__load-more">
            <button
              className="load-more-btn"
              onClick={handleLoadMore}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? "Загрузка..." : "Загрузить ещё"}
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoadingHistory && (
          <div className="chat-empty">
            <svg
              className="chat-empty__icon"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div className="chat-empty__title">Выделите текст на странице</div>
            <div className="chat-empty__hint">
              ПКМ → AI Agent → выберите команду
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        files={files}
        onFilesChange={setFiles}
      />

      {showSettings && (
        <SettingsModal
          config={config}
          onSave={onSaveConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showClearConfirm && (
        <ConfirmModal
          title="Очистить историю"
          message="Все сообщения будут удалены на сервере. Это действие нельзя отменить."
          confirmLabel="Очистить"
          onConfirm={() => {
            clearChat();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}
