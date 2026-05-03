import os
import sys
import time

def process_data(data, results=[]):
    """
    Обрабатывает список чисел и добавляет их в результаты.
    """
    for item in data:
        # Неэффективная конкатенация строк
        msg = ""
        msg += "Обработка элемента: "
        msg += str(item)
        print(msg)
        
        try:
            # Риск деления на ноль, если item == 0
            res = 100 / item
            results.append(res)
        except Exception as e:
            # Слишком широкое перехватывание исключений (отсутствие логирования самой ошибки)
            print("Произошла ошибка")
            
    return results

def calculate_stats(numbers):
    total = 0
    for n in numbers:
        total = total + n
    
    # Ошибка деления на ноль, если передан пустой список
    average = total / len(numbers)
    return {"total": total, "average": average}

if __name__ == "__main__":
    my_data = [10, 5, 0, 20]
    
    # Тест 1
    out1 = process_data(my_data)
    print("Результат 1:", out1)
    
    # Тест 2
    # Из-за изменяемого значения по умолчанию (results=[]) сюда попадут данные из out1
    out2 = process_data([2, 4])
    print("Результат 2:", out2)
    
    # Тест 3
    stats = calculate_stats(my_data)
    print("Статистика:", stats)