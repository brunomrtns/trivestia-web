import { generateCandleSeries } from '@trivestia/sim-core';
import type { Candle, ScenarioPayload } from '@/types/api';

interface SymbolConfig {
  seed: number;
  startPrice: number;
  volatility: number;
  trend: number;
  spreadBps: number;
}

interface ResolveLocalScenarioInput {
  symbol: string;
  baseCandles: Candle[];
  baseScenario: ScenarioPayload;
  baseToken: string;
}

interface ResolveLocalScenarioResult {
  symbol: string;
  candles: Candle[];
  scenario: ScenarioPayload;
  token: string;
}

const SUPPORTED_SYMBOLS: Record<string, SymbolConfig> = {
  'BTC/USD': {
    seed: 1729,
    startPrice: 42000,
    volatility: 0.022,
    trend: 0.0003,
    spreadBps: 10
  },
  'ETH/USD': {
    seed: 2718,
    startPrice: 2400,
    volatility: 0.02,
    trend: 0.0002,
    spreadBps: 12
  },
  'EUR/USD': {
    seed: 3141,
    startPrice: 1.08,
    volatility: 0.0025,
    trend: 0.00002,
    spreadBps: 4
  },
  AAPL: {
    seed: 1618,
    startPrice: 190,
    volatility: 0.011,
    trend: 0.00015,
    spreadBps: 6
  },
  TSLA: {
    seed: 1414,
    startPrice: 240,
    volatility: 0.018,
    trend: 0.0002,
    spreadBps: 8
  }
};

function toPositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.floor(value));
}

function resolveTimeframeMs(candles: Candle[]): number {
  if (candles.length < 2) return 300_000;
  const first = candles[0]?.time ?? 0;
  const second = candles[1]?.time ?? 0;
  const diff = Math.abs(second - first);
  return toPositiveInteger(diff, 300_000);
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function getSupportedLocalSymbols(): string[] {
  return Object.keys(SUPPORTED_SYMBOLS);
}

export function isLocalSymbolSupported(symbol: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_SYMBOLS, symbol);
}

export function resolveLocalPracticeScenario({
  symbol,
  baseCandles,
  baseScenario,
  baseToken
}: ResolveLocalScenarioInput): ResolveLocalScenarioResult {
  const normalizedSymbol = normalizeSymbol(symbol);
  const config = SUPPORTED_SYMBOLS[normalizedSymbol];

  if (!config) {
    throw new Error('UNSUPPORTED_SYMBOL');
  }

  const timeframeMs = resolveTimeframeMs(baseCandles);
  const numCandles = toPositiveInteger(baseCandles.length, 200);
  const lastTime = baseCandles[baseCandles.length - 1]?.time ?? Date.now();

  const candles = generateCandleSeries({
    seed: config.seed,
    numCandles,
    timeframeMs,
    startTimestamp: lastTime - numCandles * timeframeMs,
    startPrice: config.startPrice,
    volatility: config.volatility,
    trend: config.trend,
    spreadType: 'FIXED',
    spreadBps: config.spreadBps,
    volumeBase: 1000,
    volumeVariance: 0.35
  }) as Candle[];

  const scenario: ScenarioPayload = {
    ...baseScenario,
    scenarioId: `${baseScenario.scenarioId}:${normalizedSymbol.replace('/', '-')}`,
    candles,
    executionConfig: {
      ...baseScenario.executionConfig
    }
  };

  return {
    symbol: normalizedSymbol,
    candles,
    scenario,
    token: baseToken
  };
}
