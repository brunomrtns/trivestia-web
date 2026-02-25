"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEvents = exports.stableStringify = exports.computeStateHash = exports.scoreSimulation = exports.replaySimulation = exports.SimulationEngine = exports.calculateSpread = exports.generateCandleSeries = exports.randGaussian = exports.randFloat = exports.randInt = exports.createPRNG = void 0;
// ─── PRNG ─────────────────────────────────────────────
var prng_1 = require("./prng");
Object.defineProperty(exports, "createPRNG", { enumerable: true, get: function () { return prng_1.createPRNG; } });
Object.defineProperty(exports, "randInt", { enumerable: true, get: function () { return prng_1.randInt; } });
Object.defineProperty(exports, "randFloat", { enumerable: true, get: function () { return prng_1.randFloat; } });
Object.defineProperty(exports, "randGaussian", { enumerable: true, get: function () { return prng_1.randGaussian; } });
// ─── Candles ──────────────────────────────────────────
var candles_1 = require("./candles");
Object.defineProperty(exports, "generateCandleSeries", { enumerable: true, get: function () { return candles_1.generateCandleSeries; } });
// ─── Spread ───────────────────────────────────────────
var spread_1 = require("./spread");
Object.defineProperty(exports, "calculateSpread", { enumerable: true, get: function () { return spread_1.calculateSpread; } });
// ─── Execution ────────────────────────────────────────
var execution_1 = require("./execution");
Object.defineProperty(exports, "SimulationEngine", { enumerable: true, get: function () { return execution_1.SimulationEngine; } });
// ─── Replay ───────────────────────────────────────────
var replay_1 = require("./replay");
Object.defineProperty(exports, "replaySimulation", { enumerable: true, get: function () { return replay_1.replaySimulation; } });
// ─── Scoring ──────────────────────────────────────────
var scoring_1 = require("./scoring");
Object.defineProperty(exports, "scoreSimulation", { enumerable: true, get: function () { return scoring_1.scoreSimulation; } });
// ─── Hash ─────────────────────────────────────────────
var hash_1 = require("./hash");
Object.defineProperty(exports, "computeStateHash", { enumerable: true, get: function () { return hash_1.computeStateHash; } });
Object.defineProperty(exports, "stableStringify", { enumerable: true, get: function () { return hash_1.stableStringify; } });
// ─── Validation ───────────────────────────────────────
var validation_1 = require("./validation");
Object.defineProperty(exports, "validateEvents", { enumerable: true, get: function () { return validation_1.validateEvents; } });
//# sourceMappingURL=index.js.map