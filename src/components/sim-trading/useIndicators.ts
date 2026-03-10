import { useState, useMemo } from 'react';
import { calculateMA, calculateEMA, calculateRSI } from '@trivestia/sim-core';
import type { Candle } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IndicatorSeries {
  /** Array same length as candles; leading values are NaN */
  values: number[];
  color: string;
  label: string;
}

export interface IndicatorsState {
  ma: { enabled: boolean; period: number };
  ema: { enabled: boolean; period: number };
  rsi: { enabled: boolean; period: number };
}

export interface UseIndicatorsReturn {
  state: IndicatorsState;
  toggleMA: () => void;
  toggleEMA: () => void;
  toggleRSI: () => void;
  setMAPeriod: (p: number) => void;
  setEMAPeriod: (p: number) => void;
  setRSIPeriod: (p: number) => void;
  maSeries: IndicatorSeries | null;
  emaSeries: IndicatorSeries | null;
  rsiSeries: number[] | null; // RSI values array, NaN for insufficient data
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_STATE: IndicatorsState = {
  ma: { enabled: false, period: 20 },
  ema: { enabled: false, period: 9 },
  rsi: { enabled: false, period: 14 }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIndicators(candles: Candle[]): UseIndicatorsReturn {
  const [state, setState] = useState<IndicatorsState>(DEFAULT_STATE);

  // Derived prices array (close prices of all candles)
  const closes = useMemo(() => candles.map((c) => c.close), [candles]);

  // MA series
  const maSeries = useMemo<IndicatorSeries | null>(() => {
    if (!state.ma.enabled || closes.length === 0) return null;
    return {
      values: calculateMA(closes, state.ma.period),
      color: '#f59e0b', // amber-400
      label: `MM ${state.ma.period}`
    };
  }, [state.ma, closes]);

  // EMA series
  const emaSeries = useMemo<IndicatorSeries | null>(() => {
    if (!state.ema.enabled || closes.length === 0) return null;
    return {
      values: calculateEMA(closes, state.ema.period),
      color: '#a78bfa', // violet-400
      label: `MME ${state.ema.period}`
    };
  }, [state.ema, closes]);

  // RSI series
  const rsiSeries = useMemo<number[] | null>(() => {
    if (!state.rsi.enabled || closes.length === 0) return null;
    return calculateRSI(closes, state.rsi.period);
  }, [state.rsi, closes]);

  // ─── Toggles ──────────────────────────────────────────────────────────────

  const toggleMA = () =>
    setState((s) => ({ ...s, ma: { ...s.ma, enabled: !s.ma.enabled } }));

  const toggleEMA = () =>
    setState((s) => ({ ...s, ema: { ...s.ema, enabled: !s.ema.enabled } }));

  const toggleRSI = () =>
    setState((s) => ({ ...s, rsi: { ...s.rsi, enabled: !s.rsi.enabled } }));

  const setMAPeriod = (period: number) =>
    setState((s) => ({ ...s, ma: { ...s.ma, period } }));

  const setEMAPeriod = (period: number) =>
    setState((s) => ({ ...s, ema: { ...s.ema, period } }));

  const setRSIPeriod = (period: number) =>
    setState((s) => ({ ...s, rsi: { ...s.rsi, period } }));

  return {
    state,
    toggleMA,
    toggleEMA,
    toggleRSI,
    setMAPeriod,
    setEMAPeriod,
    setRSIPeriod,
    maSeries,
    emaSeries,
    rsiSeries
  };
}
