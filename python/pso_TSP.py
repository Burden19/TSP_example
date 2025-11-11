import math
import numpy as np
import random

# ----------------------------------------
# Random Keys PSO for TSP
# ----------------------------------------

# Example coordinates for 10 cities
CITIES = {
    0: (60, 200), 1: (180, 200), 2: (80, 180), 3: (140, 180),
    4: (20, 160), 5: (100, 160), 6: (200, 160), 7: (120, 140),
    8: (40, 120), 9: (160, 120)
}
NUM_CITIES = len(CITIES)

# ----------------------------------------
# Distance & Fitness Utilities
# ----------------------------------------
def distance(city1, city2):
    """Euclidean distance between two cities."""
    x1, y1 = CITIES[city1]
    x2, y2 = CITIES[city2]
    return math.hypot(x1 - x2, y1 - y2)

def tour_distance(tour):
    """Total distance of a given TSP tour."""
    dist = sum(distance(tour[i], tour[i + 1]) for i in range(NUM_CITIES - 1))
    dist += distance(tour[-1], tour[0])  # close the loop
    return dist

def fitness(tour):
    """Fitness = 1 / distance (for minimization)."""
    d = tour_distance(tour)
    return 1.0 / d if d > 0 else 0.0

# ----------------------------------------
# Random Keys Particle Swarm Optimization
# ----------------------------------------
class Particle:
    def __init__(self):
        # Continuous position and velocity
        self.position = np.random.rand(NUM_CITIES)
        self.velocity = np.zeros(NUM_CITIES)

        # Personal best (pbest)
        self.pbest_pos = self.position.copy()
        self.pbest_fit = fitness(self.decode())

    def decode(self):
        """Convert random keys into a permutation tour."""
        return [idx for _, idx in sorted((key, i) for i, key in enumerate(self.position))]

# ----------------------------------------
# RK-PSO Main Algorithm
# ----------------------------------------
def rk_pso_tsp(
    n_particles=30,
    max_iter=300,
    w=0.7,
    c1=1.5,
    c2=1.5,
    verbose=True
):
    """Random Keys PSO for the Traveling Salesman Problem."""
    # Initialize swarm
    swarm = [Particle() for _ in range(n_particles)]

    # Initialize global best
    gbest_pos = swarm[0].pbest_pos.copy()
    gbest_fit = swarm[0].pbest_fit

    for p in swarm:
        if p.pbest_fit > gbest_fit:
            gbest_fit = p.pbest_fit
            gbest_pos = p.pbest_pos.copy()

    # Main loop
    for iteration in range(max_iter):
        for p in swarm:
            # Evaluate current fitness
            current_fit = fitness(p.decode())

            # Update personal best
            if current_fit > p.pbest_fit:
                p.pbest_fit = current_fit
                p.pbest_pos = p.position.copy()

                # Update global best
                if current_fit > gbest_fit:
                    gbest_fit = current_fit
                    gbest_pos = p.position.copy()

        # Update velocities and positions
        for p in swarm:
            r1 = np.random.rand(NUM_CITIES)
            r2 = np.random.rand(NUM_CITIES)

            cognitive = c1 * r1 * (p.pbest_pos - p.position)
            social = c2 * r2 * (gbest_pos - p.position)

            p.velocity = w * p.velocity + cognitive + social
            p.position += p.velocity

            # Clamp to [0, 10]
            p.position = np.clip(p.position, 0, 10)

        if verbose and iteration % 50 == 0:
            print(f"Iteration {iteration:3d} | Best Distance: {1.0 / gbest_fit:.2f}")

    # Decode final global best
    best_tour = [idx for _, idx in sorted((key, i) for i, key in enumerate(gbest_pos))]
    best_distance = 1.0 / gbest_fit

    if verbose:
        print("\n--- RK-PSO Results ---")
        print(f"Min Distance: {best_distance:.2f}")
        print(f"Best Tour: {best_tour}")

    return best_tour, best_distance

# ----------------------------------------
# Run Example
# ----------------------------------------
if __name__ == "__main__":
    rk_pso_tsp()
