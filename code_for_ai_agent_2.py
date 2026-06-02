import sys
import heapq

def dijkstra(start, graph, n):
    dist = [float('inf')] * (n + 1)
    dist[start] = 0
    pq = [(0, start)]

    while pq:
        d, v = heapq.heappop(pq)
        if d != dist[v]:
            continue
        for to, w in graph[v]:
            nd = d + w
            if nd < dist[to]:
                dist[to] = nd
                heapq.heappush(pq, (nd, to))
    return dist

def main():
    data = sys.stdin.read().split()
    if not data:
        return

    n = int(data[0])
    m = int(data[1])

    graph = [[] for _ in range(n + 1)]
    idx = 2
    for _ in range(m):
        a = int(data[idx]); b = int(data[idx + 1]); w = int(data[idx + 2])
        idx += 3
        graph[a].append((b, w))
        graph[b].append((a, w))

    best_v = 1
    best_val = float('inf')

    for v in range(1, n + 1):
        dist = dijkstra(v, graph, n)
        ecc = max(dist[1:])
        if ecc < best_val:
            best_val = ecc
            best_v = v

    print(best_v)
    for i in range(1, n + 1):
        if i != best_v:
            print(i, dijkstra(best_v, graph, n)[i])

if __name__ == "__main__":
    main()