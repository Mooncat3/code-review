import type { ActionType } from "../types";

export const ACTIONS: { value: ActionType; label: string }[] = [
  { value: "chat", label: "Чат" },
  { value: "review", label: "Ревью кода" },
  { value: "test", label: "Написание тестов" },
  { value: "doc", label: "Написание документации" },
  { value: "fix", label: "Исправление кода" },
  { value: "explain", label: "Объяснение кода" },
];
