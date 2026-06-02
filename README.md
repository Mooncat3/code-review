# code-review

Инструмент для автоматического ревью кода на основе AI-агента. Агент принимает фрагмент кода, анализирует его и возвращает список замечаний: потенциальные ошибки, проблемы с производительностью, нарушения стиля и уязвимости.

## Состав репозитория

- `AI-Agent-n8n-workflow.json` — экспортированный workflow n8n с конфигурацией AI-агента
- `code_for_ai_agent.py` — пример Python-кода для проверки работы агента
- `test_api.py` — скрипт для тестирования API агента
- `agent-web-ui/` — веб-интерфейс (React + TypeScript + Vite) для отправки кода агенту и отображения результатов
- `agent-browser-extension/` — браузерное расширение (React + TypeScript + Vite) для вызова агента напрямую из браузера

## Требования

- [n8n](https://n8n.io/) для запуска workflow агента
- Node.js 18+ для сборки веб-интерфейса и расширения
- Python 3.10+ для запуска тестовых скриптов

## Запуск

### Агент

1. Импортируйте `AI-Agent-n8n-workflow.json` в ваш инстанс n8n.
2. Настройте переменные окружения (API-ключи модели) в настройках workflow.
3. Активируйте workflow.

### Веб-интерфейс

```bash
cd agent-web-ui
npm install
npm run dev
```

### Браузерное расширение

```bash
cd agent-browser-extension
npm install
npm run build
```

Загрузите папку `dist/` как unpacked extension в браузере (chrome://extensions).

### Тестирование API

```bash
pip install -r requirements.txt  # если есть
python test_api.py
```
