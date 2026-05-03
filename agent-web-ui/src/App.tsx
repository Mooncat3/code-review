import { useState, useCallback } from "react";
import type { ApiConfig } from "./types";
import { useChats } from "./hooks/useChats";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { SettingsModal } from "./components/SettingsModal";
import { clearHistory } from "./services/api";

const CONFIG_KEY = "ai_agent_config";

function loadConfig(): ApiConfig {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
  } catch {
    return { baseUrl: "", apiKey: "" };
  }
}

export default function App() {
  const { chats, createChat, renameChat, deleteChat } = useChats();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<ApiConfig>(loadConfig);

  const handleCreate = useCallback(() => {
    const chat = createChat();
    setActiveChatId(chat.id);
  }, [createChat]);

  const handleDelete = useCallback(
    async (id: string) => {
      const chat = chats.find((c) => c.id === id);
      if (chat && config.baseUrl && config.apiKey) {
        try {
          await clearHistory(config, chat.sessionId);
        } catch (e) {
          console.warn(
            "Не удалось очистить историю в API:",
            e instanceof Error ? e.message : e,
          );
        }
      }
      deleteChat(id);
      if (activeChatId === id) setActiveChatId(null);
    },
    [chats, config, deleteChat, activeChatId],
  );

  const handleSaveConfig = useCallback((cfg: ApiConfig) => {
    setConfig(cfg);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onCreate={handleCreate}
        onRename={renameChat}
        onDelete={handleDelete}
        onSettings={() => setShowSettings(true)}
      />

      {activeChat ? (
        <ChatWindow key={activeChat.id} chat={activeChat} config={config} />
      ) : (
        <div className="no-chat">
          <svg
            className="no-chat__logo"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <div className="no-chat__title">AI Agent Chat</div>
          <div className="no-chat__sub">Выберите или создайте новый чат</div>
          <button className="no-chat__create-btn" onClick={handleCreate}>
            Новый чат
          </button>
        </div>
      )}

      {showSettings && (
        <SettingsModal
          config={config}
          onSave={handleSaveConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
