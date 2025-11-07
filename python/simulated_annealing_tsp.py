"""
Simulated Annealing for the Travelling Salesman Problem (TSP)
-------------------------------------------------------------
Usage:
    python simulated_annealing_tsp.py
"""
import random, math


def distance(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def tour_distance(points, tour):
    return sum(distance(points[tour[i]], points[tour[(i + 1) % len(tour)]]) for i in range(len(tour)))


def simulated_annealing(points, iterations=5000, t0=1000, cooling=0.995):
    n = len(points)
    tour = list(range(n))
    random.shuffle(tour)
    best_tour = tour[:]
    best_score = tour_distance(points, tour)
    score = best_score
    T = t0

    for _ in range(iterations):
        i, j = sorted(random.sample(range(n), 2))
        candidate = tour[:i] + list(reversed(tour[i:j + 1])) + tour[j + 1:]
        cand_score = tour_distance(points, candidate)
        d = cand_score - score
        if d < 0 or random.random() < math.exp(-d / T):
            tour = candidate
            score = cand_score
            if score < best_score:
                best_score = score
                best_tour = tour[:]
        T *= cooling
    return best_tour, best_score


if __name__ == "__main__":
    pts = [(random.random() * 100, random.random() * 100) for _ in range(30)]
    tour, score = simulated_annealing(pts)
    print("Best distance:", score)
    print("Best tour:", tour)
