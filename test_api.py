import requests
import json

WEBHOOK_URL = "http://10.8.0.46:5678/webhook-test/api/ollama"

payload = {
    "action": "chat",
    "sessionId": "test_user_vscode_01",
    "message": "Объясни, что делает этот код и найди потенциальную ошибку.",
    "code": "def divide_numbers(a, b):\n    return a / b"
}

delete = False

if delete:
    payload = {
        "action": "delete",
        "sessionId": "test_user_vscode_01"
    }

try:
    print(f"Отправка запроса на {WEBHOOK_URL}...")
    
    # Отправляем POST-запрос с данными в формате JSON
    response = requests.post(WEBHOOK_URL, json=payload,
        headers={"Authorization": "Bearer your_auth_token"})
    response.raise_for_status()  # Проверяем, нет ли HTTP-ошибок (например, 404 или 500)
    
    print("\n✅ Успешно! Статус код:", response.status_code)
    print("Ответ от n8n:")

    t = response.json()
    
    # Красиво выводим полученный JSON-ответ
    print(json.dumps(t, indent=2, ensure_ascii=False))

    print()
    if "data" in t:
        print(t["data"]["content"])
    input()

except requests.exceptions.RequestException as e:
    print("\n❌ Ошибка при выполнении запроса:")
    print(e)
    input()
