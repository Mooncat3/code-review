import { useEffect, useMemo, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import { markedHighlight } from "marked-highlight";
import type { Message } from "../types";
import { ACTIONS } from "../constants/chat";

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

marked.use({ breaks: true, gfm: true });

interface Props {
  message: Message;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function MessageBubble({ message }: Props) {
  const isTyping = message.id === "typing";
  const isHuman = message.role === "human";
  const markdownRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    if (isTyping || isHuman) return null;
    return { __html: marked.parse(message.content) as string };
  }, [message.content, isTyping, isHuman]);

  useEffect(() => {
    const el = markdownRef.current;
    if (!el) return;

    el.querySelectorAll("pre").forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-wrapper")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "code-wrapper";

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.setAttribute("aria-label", "Копировать код");
      btn.innerHTML = `
      <svg class="copy-btn__icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <svg class="copy-btn__check" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;

      btn.addEventListener("click", () => {
        const text = pre.querySelector("code")?.innerText ?? "";
        navigator.clipboard.writeText(text).then(() => {
          btn.classList.add("copy-btn--copied");
          setTimeout(() => btn.classList.remove("copy-btn--copied"), 2000);
        });
      });

      pre.replaceWith(wrapper);
      wrapper.appendChild(btn);
      wrapper.appendChild(pre);
    });
  }, [html]);

  return (
    <div
      className={`message message--${isHuman ? "human" : "ai"}${isTyping ? " message--typing" : ""}`}
    >
      {isHuman && (
        <span className="message__action-badge">
          {ACTIONS.find((v) => v.value === message.action)?.label || "Чат"}
        </span>
      )}

      {((isHuman && message.content) || !isHuman) && (
        <div className="message__bubble">
          {isTyping ? (
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          ) : isHuman ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
          ) : (
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={html!}
              ref={markdownRef}
            />
          )}
        </div>
      )}

      {isHuman && message.files && message.files.length > 0 && (
        <div className="message__files">
          {message.files.map((f) => (
            <span key={f.name} className="message__file-tag">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {f.name}
            </span>
          ))}
        </div>
      )}

      {!isTyping && (
        <div className="message__meta">
          <span className="message__sender">{isHuman ? "Вы" : "AI"}</span>

          <span className="message__time">{formatTime(message.timestamp)}</span>
        </div>
      )}
    </div>
  );
}
