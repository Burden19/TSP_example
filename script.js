document.addEventListener("DOMContentLoaded", () => {
// script.js — TSP visualizer with GA, SA, Tabu Search, and PSO (Random Keys)
// ---------- Canvas & UI ----------
const canvas = document.getElementById('tspCanvas');
const ctx = canvas.getContext('2d');
const algoSelect = document.getElementById('algoSelect');
const cityCountInput = document.getElementById('cityCount');
const iterationsInput = document.getElementById('iterations');
const genBtn = document.getElementById('genPoints');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const currentDistSpan = document.getElementById('currentDist');
const bestDistSpan = document.getElementById('bestDist');
const iterCountSpan = document.getElementById('iterCount');

const psoControls = document.getElementById('psoControls');
const psoParticlesInput = document.getElementById('psoParticles');
const psoWInput = document.getElementById('psoW');
const psoC1Input = document.getElementById('psoC1');
const psoC2Input = document.getElementById('psoC2');

let WIDTH = canvas.width, HEIGHT = canvas.height;
window.addEventListener('resize', () => {/*no-op for now*/});

let points = [];
let running = false;
let paused = false;
let iter = 0;
let state = null; // holds algorithm-specific state

function draw(points, bestTour) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // draw edges
    if (bestTour && points.length > 0) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        let a = points[bestTour[0]];
        ctx.moveTo(a.x, a.y);
        for (let i = 1; i < bestTour.length; i++) {
            let p = points[bestTour[i]];
            ctx.lineTo(p.x, p.y);
        }
        ctx.lineTo(points[bestTour[0]].x, points[bestTour[0]].y);
        ctx.strokeStyle = 'rgba(30,144,255,0.9)';
        ctx.stroke();
    }
    // points
    for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#04263a';
        ctx.fill();
        ctx.strokeStyle = '#60a5fa';
        ctx.stroke();
    }
}

// ---------- Utilities ----------
function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function dist(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function tourDistance(points, tour) {
    let d = 0;
    for (let i = 0; i < tour.length - 1; i++) {
        d += dist(points[tour[i]], points[tour[i + 1]]);
    }
    d += dist(points[tour[tour.length - 1]], points[tour[0]]); // return to start
    return d;
}

// Decode Random Keys -> permutation (JS version)
function decodeRandomKeys(keys) {
    const keyed = keys.map((v, i) => ({v, i}));
    keyed.sort((a, b) => a.v - b.v);
    return keyed.map(x => x.i);
}

// ---------- Data generation ----------
function generatePoints(n) {
    points = [];
    const pad = 30;
    for (let i = 0; i < n; i++) {
        points.push({x: rand(pad, WIDTH - pad), y: rand(pad, HEIGHT - pad)});
    }
}

// ---------- Genetic Algorithm (GA) ----------
function gaInit() {
    const popSize = Math.min(200, Math.max(20, +iterationsInput.value));
    const n = points.length;
    let pop = [];
    for (let i = 0; i < popSize; i++) {
        let tour = Array.from({length: n}, (_, k) => k);
        shuffle(tour);
        pop.push({tour, score: tourDistance(points, tour)});
    }
    pop.sort((a, b) => a.score - b.score);
    state = {
        pop,
        gen: 0,
        elite: Math.max(1, Math.floor(popSize * 0.05)),
        best: pop[0]
    };
}

function gaStep() {
    const pop = state.pop;
    const n = points.length; // selection: tournament
    const next = [];
    while (next.length < pop.length) {
        function pick() {
            const a = pop[Math.floor(Math.random() * pop.length)];
            const b = pop[Math.floor(Math.random() * pop.length)];
            return a.score < b.score ? a : b;
        }

        const p1 = pick();
        const p2 = pick(); // OX crossover
        const childTour = orderCrossover(p1.tour, p2.tour);
        mutate(childTour, 0.12);
        const score = tourDistance(points, childTour);
        next.push({tour: childTour, score});
    }
    next.sort((a, b) => a.score - b.score); // elitism
    for (let i = 0; i < state.elite && i < pop.length; i++) next[pop.length - 1 - i] = pop[i];
    state.pop = next;
    state.gen++;
    if (next[0].score < state.best.score) state.best = next[0];
}

function orderCrossover(a, b) {
    const n = a.length;
    const child = new Array(n).fill(null);
    const i = Math.floor(rand(0, n));
    const j = Math.floor(rand(0, n));
    const [l, r] = [Math.min(i, j), Math.max(i, j)];
    for (let k = l; k <= r; k++) {
        child[k] = a[k];
    }
    let idx = (r + 1) % n;
    for (let k = 0; k < n; k++) {
        const val = b[(r + 1 + k) % n];
        if (!child.includes(val)) {
            child[idx] = val;
            idx = (idx + 1) % n;
        }
    }
    return child;
}

function mutate(tour, rate) {
    for (let i = 0; i < tour.length; i++) {
        if (Math.random() < rate) {
            const j = Math.floor(Math.random() * tour.length);
            [tour[i], tour[j]] = [tour[j], tour[i]];
        }
    }
}

// ---------- Simulated Annealing (SA) ----------
function saInit() {
    const n = points.length;
    const tour = Array.from({length: n}, (_, k) => k);
    shuffle(tour);
    const score = tourDistance(points, tour);
    state = {tour, score, temp: Math.max(1, Math.log(n) * 100), cooling: 0.995, best: {tour: tour.slice(), score}};
}

function saStep() {
    const s = state; // 2-opt neighbor
    const a = Math.floor(rand(0, s.tour.length));
    const b = Math.floor(rand(0, s.tour.length));
    if (a === b) return;
    const i = Math.min(a, b), j = Math.max(a, b);
    const newTour = s.tour.slice(0, i).concat(s.tour.slice(i, j + 1).reverse(), s.tour.slice(j + 1));
    const newScore = tourDistance(points, newTour);
    const d = newScore - s.score;
    if (d < 0 || Math.random() < Math.exp(-d / s.temp)) {
        s.tour = newTour;
        s.score = newScore;
        if (newScore < s.best.score) {
            s.best.tour = newTour.slice();
            s.best.score = newScore;
        }
    }
    s.temp *= s.cooling;
}

// ---------- Tabu Search (TS) ----------
function tsInit() {
    const n = points.length;
    let tour = Array.from({length: n}, (_, k) => k);
    shuffle(tour);
    let bestScore = tourDistance(points, tour);
    state = {
        tour,
        score: bestScore,
        best: {tour: tour.slice(), score: bestScore},
        tabu: [],
        tabuSize: Math.max(10, Math.floor(n * 0.1))
    };
}

function tsStep() {
    const s = state;
    const n = s.tour.length;
    let bestNeighbor = null;
    let bestNeighborScore = Infinity;
    let bestMove = null;
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            const candidate = s.tour.slice();
            candidate.splice(i, j - i + 1, ...s.tour.slice(i, j + 1).reverse());
            const candScore = tourDistance(points, candidate);
            const move = `${i}-${j}`;
            if (s.tabu.includes(move)) continue;
            if (candScore < bestNeighborScore) {
                bestNeighbor = candidate;
                bestNeighborScore = candScore;
                bestMove = move;
            }
        }
    }
    if (bestNeighbor) {
        s.tour = bestNeighbor;
        s.score = bestNeighborScore;
        s.tabu.push(bestMove);
        if (s.tabu.length > s.tabuSize) s.tabu.shift();
        if (s.score < s.best.score) {
            s.best.tour = s.tour.slice();
            s.best.score = s.score;
        }
    }
}

// ---------- PSO (Random Keys) ----------
function psoInit() {
    const n = points.length;
    const npart = Math.max(4, Math.min(500, +psoParticlesInput.value || 30));
    const W = parseFloat(psoWInput.value) || 0.7;
    const C1 = parseFloat(psoC1Input.value) || 1.5;
    const C2 = parseFloat(psoC2Input.value) || 1.5;

    // Each particle: position (random keys), velocity, pbest_pos, pbest_score
    const particles = [];
    let gbest_pos = null;
    let gbest_score = Infinity; // distance (lower is better)

    for (let i = 0; i < npart; i++) {
        const pos = Array.from({length: n}, () => rand(0, 10));
        const vel = Array.from({length: n}, () => 0);
        const tour = decodeRandomKeys(pos);
        const score = tourDistance(points, tour);
        const pbest_pos = pos.slice();
        const pbest_score = score;
        if (score < gbest_score) {
            gbest_score = score;
            gbest_pos = pos.slice();
        }
        particles.push({position: pos, velocity: vel, pbest_pos, pbest_score});
    }

    state = {
        algo: 'pso',
        particles,
        gbest_pos,
        gbest_score,
        params: {W, C1, C2},
        best: {tour: decodeRandomKeys(gbest_pos), score: gbest_score}
    };
}

function psoStep() {
    const s = state;
    const {W, C1, C2} = s.params;
    const n = points.length;

    // 1) Update pbest and gbest based on current positions
    for (let p of s.particles) {
        const tour = decodeRandomKeys(p.position);
        const score = tourDistance(points, tour);
        if (score < p.pbest_score) {
            p.pbest_score = score;
            p.pbest_pos = p.position.slice();
        }
        if (score < s.gbest_score) {
            s.gbest_score = score;
            s.gbest_pos = p.position.slice();
            s.best.tour = tour.slice();
            s.best.score = score;
        }
    }

    // 2) Update velocity and position
    for (let p of s.particles) {
        for (let k = 0; k < n; k++) {
            const r1 = Math.random();
            const r2 = Math.random();
            const cognitive = C1 * r1 * (p.pbest_pos[k] - p.position[k]);
            const social = C2 * r2 * (s.gbest_pos[k] - p.position[k]);
            p.velocity[k] = W * p.velocity[k] + cognitive + social;
            p.position[k] = p.position[k] + p.velocity[k];
            // clamp to a sensible range (to avoid huge keys)
            if (p.position[k] < 0) p.position[k] = 0;
            if (p.position[k] > 10) p.position[k] = 10;
        }
    }

    // after movement, we update best for UI (gbest already updated above)
}

// ---------- Runner & UI integration ----------
function initAlgorithm() {
    const algo = algoSelect.value;
    iter = 0;
    state = null;
    if (!points.length) return;

    if (algo === 'ga') gaInit();
    else if (algo === 'sa') saInit();
    else if (algo === 'ts') tsInit();
    else if (algo === 'pso') psoInit();

    updateUI();
}

function updateUI() {
    if (!state || !points.length) {
        currentDistSpan.textContent = '-';
        bestDistSpan.textContent = '-';
        iterCountSpan.textContent = '0';
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        if (points.length) draw(points, null);
        return;
    }

    let currentScore = '-';
    let bestScore = '-';
    let bestTour = null;

    const algo = algoSelect.value;
    if (algo === 'ga') {
        currentScore = Math.round(state.pop[0].score);
        bestScore = Math.round(state.best.score);
        bestTour = state.best.tour;
    } else if (algo === 'sa') {
        currentScore = Math.round(state.score);
        bestScore = Math.round(state.best.score);
        bestTour = state.best.tour;
    } else if (algo === 'ts') {
        currentScore = Math.round(state.score);
        bestScore = Math.round(state.best.score);
        bestTour = state.best.tour;
    } else if (algo === 'pso') {
        currentScore = Math.round(state.gbest_score);
        bestScore = Math.round(state.best.score);
        bestTour = state.best.tour;
    }

    draw(points, bestTour);
    currentDistSpan.textContent = currentScore;
    bestDistSpan.textContent = bestScore;
    iterCountSpan.textContent = iter;
}

function stepAlgorithm() {
    const algo = algoSelect.value;
    if (!points.length || !state) return;
    if (algo === 'ga') gaStep();
    else if (algo === 'sa') saStep();
    else if (algo === 'ts') tsStep();
    else if (algo === 'pso') psoStep();

    iter++;
    updateUI();
}

function run() {
    if (!running) {
        // UI reset when stopped
        startBtn.disabled = false;
        genBtn.disabled = false;
        cityCountInput.disabled = false;
        iterationsInput.disabled = false;
        algoSelect.disabled = false;
        pauseBtn.textContent = 'Pause';
        return;
    }
    if (!paused) {
        const maxIter = +iterationsInput.value;
        if (iter < maxIter) {
            stepAlgorithm();
        } else {
            running = false;
        }
    }
    requestAnimationFrame(run);
}

// ---------- Event Listeners ----------
genBtn.addEventListener('click', () => {
    running = false;
    const n = +cityCountInput.value;
    generatePoints(n);
    initAlgorithm();
});

startBtn.addEventListener('click', () => {
    if (!points.length) {
        genBtn.click();
    }
    if (!state) {
        initAlgorithm();
    }
    if (running && !paused) return;

    running = true;
    paused = false;

    startBtn.disabled = true;
    genBtn.disabled = true;
    cityCountInput.disabled = true;
    iterationsInput.disabled = true; // Disable iterations input during run
    algoSelect.disabled = true;
    pauseBtn.textContent = 'Pause';

    requestAnimationFrame(run);
});

pauseBtn.addEventListener('click', () => {
    if (!running) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
});

stepBtn.addEventListener('click', () => {
    if (!points.length) {
        genBtn.click();
        return;
    }
    if (!state) {
        initAlgorithm();
    }

    if (running) {
        paused = true;
        pauseBtn.textContent = 'Resume';
    }

    stepAlgorithm();
});

resetBtn.addEventListener('click', () => {
    running = false;
    paused = false;
    points = [];
    state = null;
    iter = 0;

    updateUI(); // This will clear the UI and canvas

    startBtn.disabled = false;
    genBtn.disabled = false;
    cityCountInput.disabled = false;
    iterationsInput.disabled = false; // Re-enable iterations input
    algoSelect.disabled = false;
    pauseBtn.textContent = 'Pause';
});

algoSelect.addEventListener('change', () => {
    const algo = algoSelect.value;
    // Show/hide PSO controls
    if (algo === 'pso') psoControls.style.display = '';
    else psoControls.style.display = 'none';

    // When algorithm changes, re-initialize
    if (points.length) {
        running = false;
        initAlgorithm();
    }
});

// Ensure PSO control visibility on load
if (algoSelect.value === 'pso') psoControls.style.display = '';
else psoControls.style.display = 'none';

// Initial setup
genBtn.click();

}); // end of DOMContentLoaded
