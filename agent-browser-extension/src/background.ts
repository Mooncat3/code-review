/// <reference types="chrome" />
import type { ActionType } from "./types";

const ACTIONS: { id: ActionType; title: string }[] = [
  { id: "chat", title: "AI: Чат" },
  { id: "review", title: "AI: Ревью кода" },
  { id: "test", title: "AI: Написание тестов" },
  { id: "doc", title: "AI: Написание документации" },
  { id: "fix", title: "AI: Исправление кода" },
  { id: "explain", title: "AI: Объяснение кода" },
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("userId").then((result) => {
    if (!result.userId) {
      const userId = crypto.randomUUID();
      chrome.storage.local.set({ userId });
    }
  });

  chrome.contextMenus.create({
    id: "ai-agent-parent",
    title: "AI Agent",
    contexts: ["selection"],
  });
  for (const action of ACTIONS) {
    chrome.contextMenus.create({
      id: action.id,
      parentId: "ai-agent-parent",
      title: action.title,
      contexts: ["selection"],
    });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const action = info.menuItemId as ActionType;

  // Открываем панель ПЕРВЫМ — пока ещё активен жест пользователя
  await chrome.sidePanel.open({ tabId: tab.id });

  // Получаем текст с сохранёнными переносами строк
  let selectedText = info.selectionText ?? "";
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? "",
    });
    if (results?.[0]?.result) selectedText = results[0].result;
  } catch {
    //
  }

  if (!selectedText.trim()) return;

  const payload = { action, text: selectedText, ts: Date.now() };

  await chrome.storage.session.set({ pendingAction: payload });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await chrome.sidePanel.open({ tabId: tab.id });
});

async function broadcastTabHost(tabId: number) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const host =
      tab.url && tab.url.startsWith("http")
        ? new URL(tab.url).hostname
        : "local";
    await chrome.storage.session.set({ currentTabHost: host });
    chrome.runtime.sendMessage({ type: "TAB_CHANGED", host }).catch(() => {});
  } catch {
    //
  }
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  broadcastTabHost(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.active) return;
  if (changeInfo.url || changeInfo.status === "complete") {
    broadcastTabHost(tabId);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab?.id) broadcastTabHost(tab.id);
  } catch {
    //
  }
});
