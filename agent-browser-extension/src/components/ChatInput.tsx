import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import type { ActionType, AttachedFile } from "../types";
import "../styles/input.css";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_KB,
  MAX_FILES,
  readFiles,
} from "../utils/files";
import { ACTIONS } from "../constants/chat";

interface Props {
  onSend: (text: string, action: ActionType, files?: AttachedFile[]) => void;
  disabled: boolean;
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
}

export function ChatInput({ onSend, disabled, files, onFilesChange }: Props) {
  const [text, setText] = useState("");
  const [action, setAction] = useState<ActionType>("chat");
  const [fileError, setFileError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!text.trim() && files.length === 0) || disabled) return;
    onSend(text, action, files.length > 0 ? files : undefined);
    setText("");
    onFilesChange([]);
    setFileError("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    const { added, error } = await readFiles(selected, files);
    if (error) setFileError(error);
    if (added.length) onFilesChange([...files, ...added]);
  };

  const removeFile = (name: string) => {
    onFilesChange(files.filter((f) => f.name !== name));
    setFileError("");
  };

  const canSend = (text.trim().length > 0 || files.length > 0) && !disabled;

  return (
    <div className="chat-input-area">
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f) => (
            <div key={f.name} className="file-chip">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="file-chip__name">{f.name}</span>
              <span className="file-chip__size">
                {(f.size / 1024).toFixed(1)}KB
              </span>
              <button
                className="file-chip__remove"
                onClick={() => removeFile(f.name)}
                aria-label="Удалить файл"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {fileError && <div className="file-error">{fileError}</div>}

      <div className="chat-input-form">
        <div className="chat-input-form__top">
          <textarea
            ref={textareaRef}
            className="chat-input-form__textarea"
            placeholder="Напишите сообщение или код... (Shift+Enter для новой строки)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={1}
            disabled={disabled}
          />
        </div>
        <div className="chat-input-form__bottom">
          <select
            className="action-select"
            value={action}
            onChange={(e) => setAction(e.target.value as ActionType)}
            disabled={disabled}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          <button
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || files.length >= MAX_FILES}
            title={`Прикрепить файл (макс. ${MAX_FILES}, до ${MAX_FILE_SIZE_KB}KB)`}
            aria-label="Прикрепить файл"
            type="button"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            {files.length > 0 && (
              <span className="attach-btn__count">{files.length}</span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Отправить"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
