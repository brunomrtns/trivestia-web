import type { CandleConfig, PRNGFn } from './types';
/**
 * Calcula o spread em basis points para um candle.
 * FIXED: spread constante.
 * VOLATILITY_BASED: spread widen com volatilidade.
 */
export declare function calculateSpread(config: CandleConfig, rng: PRNGFn, _candleIndex: number): number;
//# sourceMappingURL=spread.d.ts.map