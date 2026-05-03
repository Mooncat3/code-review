import "./popup.css";

export function Popup() {
  const openPanel = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  return (
    <div className="popup">
      <div className="popup__logo">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        AI Agent
      </div>
      <p className="popup__hint">
        Выделите текст на странице, нажмите правую кнопку мыши и выберите
        команду в меню <strong>AI Agent</strong>.
      </p>
      <button className="popup__btn" onClick={openPanel}>
        Открыть панель чата
      </button>
    </div>
  );
}
