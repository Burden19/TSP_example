"""
Genetic Algorithm for the Travelling Salesman Problem (TSP)
-----------------------------------------------------------
Usage:
    python genetic_tsp.py
"""
import random, math


def distance(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def tour_distance(points, tour):
    return sum(distance(points[tour[i]], points[tour[(i + 1) % len(tour)]]) for i in range(len(tour)))


def order_crossover(a, b):
    n = len(a)
    child = [None] * n
    i, j = sorted(random.sample(range(n), 2))
    child[i:j + 1] = a[i:j + 1]
    pos = (j + 1) % n
    for k in range(n):
        val = b[(j + 1 + k) % n]
        if val not in child:
            child[pos] = val
            pos = (pos + 1) % n
    return child


def mutate(tour, rate=0.12):
    for i in range(len(tour)):
        if random.random() < rate:
            j = random.randrange(len(tour))
            tour[i], tour[j] = tour[j], tour[i]


def genetic_tsp(points, pop_size=120, generations=800):
    n = len(points)
    pop = []
    for _ in range(pop_size):
        tour = list(range(n))
        random.shuffle(tour)
        pop.append((tour, tour_distance(points, tour)))

    pop.sort(key=lambda x: x[1])
    best = pop[0]

    for _ in range(generations):
        next_pop = []
        # Elitism
        next_pop.extend(pop[:max(1, int(pop_size * 0.05))])
        # Selection + Crossover
        while len(next_pop) < pop_size:
            a = random.choice(pop)[0]
            b = random.choice(pop)[0]
            child = order_crossover(a, b)
            mutate(child)
            next_pop.append((child, tour_distance(points, child)))
        pop = sorted(next_pop, key=lambda x: x[1])
        if pop[0][1] < best[1]:
            best = pop[0]
    return best


if __name__ == "__main__":
    pts = [(random.random() * 100, random.random() * 100) for _ in range(30)]
    best = genetic_tsp(pts)
    print("Best distance:", best[1])
    print("Best tour:", best[0])
