import sys

def main():
    input_data = sys.stdin.read().split()
    idx = 0
    
    n = int(input_data[idx]); idx += 1  # количество городов
    m = int(input_data[idx]); idx += 1  # количество дорог
    
    edges = []
    for i in range(m):
        a = int(input_data[idx]);     idx += 1
        b = int(input_data[idx]);     idx += 1
        w = int(input_data[idx]);     idx += 1
        edges.append((w, a, b))
    
    # Сортировка рёбер по стоимости (по возрастанию)
    edges.sort()
    
    # --- Union-Find (система непересекающихся множеств) ---
    parent = list(range(n + 1))
    rank   = [0] * (n + 1)
    
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # сжатие пути
            x = parent[x]
        return x
    
    def union(x, y):
        rx, ry = find(x), find(y)
        if rx == ry:
            return False  # уже в одном компоненте → цикл
        if rank[rx] < rank[ry]:
            rx, ry = ry, rx
        parent[ry] = rx
        if rank[rx] == rank[ry]:
            rank[rx] += 1
        return True
    
    # --- Алгоритм Краскала ---
    total_cost = 0
    mst_edges  = []
    
    for w, a, b in edges:
        if union(a, b):
            total_cost += w
            mst_edges.append((a, b))
            if len(mst_edges) == n - 1:
                break  # MST готово (n-1 рёбер)
    
    # --- Вывод результата ---
    print(total_cost)
    for a, b in mst_edges:
        print(a, b)

if __name__ == "__main__":
    main()