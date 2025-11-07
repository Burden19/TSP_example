"""
Tabu Search for the Travelling Salesman Problem (TSP)
-----------------------------------------------------
Usage:
    python tabu_search_tsp.py
"""
import random, math


def distance(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def tour_distance(points, tour):
    return sum(distance(points[tour[i]], points[tour[(i + 1) % len(tour)]]) for i in range(len(tour)))


def tabu_search(points, iterations=1000, tabu_size=50):
    n = len(points)
    tour = list(range(n))
    random.shuffle(tour)
    best_tour = tour[:]
    best_score = tour_distance(points, tour)
    tabu = []

    for _ in range(iterations):
        best_neighbor = None
        best_neighbor_score = float("inf")
        best_move = None

        for i in range(n - 1):
            for j in range(i + 1, n):
                candidate = tour[:i] + list(reversed(tour[i:j + 1])) + tour[j + 1:]
                score = tour_distance(points, candidate)
                move = (i, j)
                if move in tabu:
                    continue
                if score < best_neighbor_score:
                    best_neighbor = candidate
                    best_neighbor_score = score
                    best_move = move

        if not best_neighbor:
            break

        tour = best_neighbor
        if best_neighbor_score < best_score:
            best_score = best_neighbor_score
            best_tour = tour[:]

        tabu.append(best_move)
        if len(tabu) > tabu_size:
            tabu.pop(0)

    return best_tour, best_score


if __name__ == "__main__":
    pts = [(random.random() * 100, random.random() * 100) for _ in range(30)]
    tour, score = tabu_search(pts)
    print("Best distance:", score)
    print("Best tour:", tour)
