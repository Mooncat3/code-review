import { useState, useCallback } from "react";
import type { Chat } from "../types";

const STORAGE_KEY = "ai_agent_chats";

function loadChats(): Chat[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveChats(chats: Chat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>(loadChats);

  const createChat = useCallback((name?: string): Chat => {
    const id = crypto.randomUUID();
    const chat: Chat = {
      id,
      sessionId: id,
      name:
        name ||
        `Чат ${new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
      createdAt: Date.now(),
    };
    setChats((prev) => {
      const updated = [chat, ...prev];
      saveChats(updated);
      return updated;
    });
    return chat;
  }, []);

  const renameChat = useCallback((id: string, name: string) => {
    setChats((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, name } : c));
      saveChats(updated);
      return updated;
    });
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveChats(updated);
      return updated;
    });
  }, []);

  return { chats, createChat, renameChat, deleteChat };
}
