import { useState } from "react";
import type { ApiConfig } from "../types";
import "../styles/modal.css";

interface Props {
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
  onClose: () => void;
}

export function SettingsModal({ config, onSave, onClose }: Props) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);

  const handleSave = () => {
    onSave({ baseUrl: baseUrl.replace(/\/$/, ""), apiKey });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-labelledby="modal-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">
            Настройки подключения
          </h2>
          <button
            className="modal__close-btn"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal__body">
          <div className="field">
            <label className="field__label" htmlFor="base-url">
              URL сервера n8n
            </label>
            <input
              id="base-url"
              className="field__input"
              type="url"
              placeholder="http://localhost:5678"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <span className="field__hint">Базовый URL без слеша на конце</span>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="api-key">
              API ключ (Authorization)
            </label>
            <input
              id="api-key"
              className="field__input"
              type="password"
              placeholder="Bearer ..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <span className="field__hint">
              Значение заголовка Authorization из n8n webhook
            </span>
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button className="btn-save" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
