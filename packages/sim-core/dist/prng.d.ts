import type { PRNGFn } from './types';
/**
 * Mulberry32 — PRNG determinístico de 32 bits.
 * Produz a mesma sequência para o mesmo seed em qualquer plataforma.
 * Não é criptograficamente seguro, mas é rápido e suficiente para simulação.
 */
export declare function createPRNG(seed: number): PRNGFn;
export declare function randInt(rng: PRNGFn, min: number, max: number): number;
export declare function randFloat(rng: PRNGFn, min: number, max: number): number;
export declare function randGaussian(rng: PRNGFn, mean?: number, stdev?: number): number;
//# sourceMappingURL=prng.d.ts.map