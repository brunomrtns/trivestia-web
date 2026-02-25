import type { Candle, ExecutionConfig, SimulationResult, SimEvent } from './types';
/**
 * Executa replay completo: candles + events → SimulationResult.
 * FIX v3.0.1: eventCount é o length real do array de events, não state.tradeCount.
 * FIX v3.0.1: computeResult recebe SimulationState importado explicitamente.
 */
export declare function replaySimulation(candles: Candle[], events: SimEvent[], config: ExecutionConfig): SimulationResult;
//# sourceMappingURL=replay.d.ts.map