export type ActionType = "chat" | "review" | "test" | "doc" | "fix" | "explain";

export interface Chat {
  id: string;
  name: string;
  sessionId: string;
  createdAt: number;
}

export interface Message {
  id: string;
  role: "human" | "ai";
  content: string;
  timestamp: number;
  action?: ActionType;
  files?: AttachedFile[];
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

export interface RawMessage {
  id: number;
  type: "human" | "ai";
  content: string;
  action: ActionType;
  timestamp: number;
  files?: string[];
}

export interface AttachedFile {
  name: string;
  content: string; // текстовое содержимое
  size: number;
}
