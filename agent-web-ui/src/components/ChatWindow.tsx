import { useEffect, useRef, useCallback, useState } from "react";
import type { Chat, ApiConfig, ActionType, AttachedFile } from "../types";
import { useChatSession } from "../hooks/useChatSession";
import { readFiles, MAX_FILES, MAX_FILE_SIZE_KB } from "../utils/files";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import "../styles/chat.css";
import { ConfirmModal } from "./ConfirmModal";

interface Props {
  chat: Chat;
  config: ApiConfig;
}

export function ChatWindow({ chat, config }: Props) {
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
  } = useChatSession(chat.sessionId, config);

  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearConfirm = () => {
    clearChat();
    setShowClearConfirm(false);
  };

  // Загружаем историю при открытии чата
  useEffect(() => {
    loadInitialHistory();
  }, [loadInitialHistory]);

  // Скролл вниз на новое сообщение (только если уже внизу)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom || isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

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

  const reloadHistory = useCallback(async () => {
    resetLocalState();
    await loadInitialHistory();
  }, [resetLocalState, loadInitialHistory]);

  return (
    <div
      className="chat-window"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="chat-window__header">
        <span className="chat-window__title">{chat.name}</span>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            className="chat-window__clear-btn"
            onClick={reloadHistory}
            title="Обновить историю"
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
            Обновить
          </button>
          <button
            className="chat-window__clear-btn"
            onClick={() => setShowClearConfirm(true)}
            title="Очистить историю"
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
            Очистить
          </button>
        </div>
      </div>

      {/* Overlay при перетаскивании */}
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

      <div className="chat-messages" ref={scrollRef}>
        {hasMore && (
          <div className="chat-messages__load-more">
            <button
              className="load-more-btn"
              onClick={handleLoadMore}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Загрузка...
                </>
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  Загрузить ещё
                </>
              )}
            </button>
          </div>
        )}

        {messages.length === 0 && !isLoadingHistory && (
          <div className="chat-empty">
            <svg
              className="chat-empty__icon"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div className="chat-empty__title">Начните диалог</div>
            <div className="chat-empty__hint">
              Выберите тип задачи и отправьте сообщение или код
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

      {showClearConfirm && (
        <ConfirmModal
          title="Очистить историю"
          message="Все сообщения этого чата будут удалены на сервере. Это действие нельзя отменить."
          confirmLabel="Очистить"
          onConfirm={handleClearConfirm}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}
