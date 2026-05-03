import "../styles/modal.css";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Подтвердить",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal" role="dialog" aria-labelledby="confirm-title">
        <div className="modal__header">
          <h2 className="modal__title" id="confirm-title">
            {title}
          </h2>
          <button
            className="modal__close-btn"
            onClick={onCancel}
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
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>
        </div>
        <div className="modal__footer">
          <button className="btn-cancel" onClick={onCancel}>
            Отмена
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
