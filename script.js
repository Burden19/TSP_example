// script.js — TSP visualizer with GA, SA, Tabu Search
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


let WIDTH = canvas.width, HEIGHT = canvas.height;
window.addEventListener('resize', () => {/*no-op for now*/
});


let points = [];
let running = false;
let paused = false;
let iter = 0;
let state = null; // holds algorithm-specific state


function draw(points, bestTour) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
// draw edges
    if (bestTour) {
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
    state = {
        pop,
        gen: 0,
        elite: Math.max(1, Math.floor(popSize * 0.05)),
        best: pop.reduce((a, b) => a.score < b.score ? a : b)
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


// ---------- Runner ----------
function initAlgorithm() {
    const algo = algoSelect.value;
    iter = 0;
    iterCountSpan.textContent = '0';
    if (algo === 'ga') gaInit(); else if (algo === 'sa') saInit(); else tsInit();
}

function stepAlgorithm() {
    const algo = algoSelect.value;
    if (!points.length) return;
    if (algo === 'ga') gaStep(); else if (algo === 'sa') saStep(); else tsStep();
    iter++;
    iterCountSpan.textContent = iter;
// update UI
    let best = null;
}