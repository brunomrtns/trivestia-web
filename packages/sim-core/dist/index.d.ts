export type {
  PRNGFn,
  CandleConfig,
  Candle,
  OrderSide,
  OrderType,
  OrderStatus,
  PositionSide,
  OrderRequest,
  Fill,
  Position,
  ExecutionConfig,
  SimEvent,
  SimulationState,
  SimulationResult,
  ScoringConfig,
  ScoreResult,
  ScenarioConfig,
  ScenarioPayload
} from './types';
export { createPRNG, randInt, randFloat, randGaussian } from './prng';
export { generateCandleSeries } from './candles';
export { calculateSpread } from './spread';
export { SimulationEngine } from './execution';
export { replaySimulation } from './replay';
export { scoreSimulation } from './scoring';
export { computeStateHash, stableStringify } from './hash';
export { validateEvents } from './validation';
export type { ValidationResult } from './validation';
export { calculateMA, calculateEMA, calculateRSI } from './indicators';
//# sourceMappingURL=index.d.ts.map
