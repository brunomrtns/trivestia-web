// ─── PRNG ─────────────────────────────────────────────
export { createPRNG, randInt, randFloat, randGaussian } from './prng.js';
// ─── Candles ──────────────────────────────────────────
export { generateCandleSeries } from './candles.js';
// ─── Spread ───────────────────────────────────────────
export { calculateSpread } from './spread.js';
// ─── Execution ────────────────────────────────────────
export { SimulationEngine } from './execution.js';
// ─── Replay ───────────────────────────────────────────
export { replaySimulation } from './replay.js';
// ─── Scoring ──────────────────────────────────────────
export { scoreSimulation } from './scoring.js';
// ─── Hash ─────────────────────────────────────────────
export { computeStateHash, stableStringify } from './hash.js';
// ─── Validation ───────────────────────────────────────
export { validateEvents } from './validation.js';
export { calculateMA, calculateEMA, calculateRSI } from './indicators.js';
//# sourceMappingURL=index.js.map
