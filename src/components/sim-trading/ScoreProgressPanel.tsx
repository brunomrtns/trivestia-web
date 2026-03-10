import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { scoreSimulation } from '@trivestia/sim-core';
import type { SimulationState, ScoringConfig } from '@/types/api';

interface ScoreProgressPanelProps {
  engineState: SimulationState;
  scoringConfig: ScoringConfig;
  initialBalance: number;
}

// Build a partial SimulationResult from live engine state to feed scoreSimulation
function buildPartialResult(state: SimulationState, initialBalance: number) {
  const totalPnl = state.equity - initialBalance;
  const totalPnlPercent = (totalPnl / initialBalance) * 100;

  // Drawdown from equityCurve
  let peak = initialBalance;
  let maxDDPct = 0;
  for (const eq of state.equityCurve) {
    if (eq > peak) peak = eq;
    const ddPct = peak > 0 ? ((peak - eq) / peak) * 100 : 0;
    if (ddPct > maxDDPct) maxDDPct = ddPct;
  }

  // Sharpe from equityCurve
  let sharpeRatio = 0;
  if (state.equityCurve.length >= 2) {
    const returns: number[] = [];
    for (let i = 1; i < state.equityCurve.length; i++) {
      const prev = state.equityCurve[i - 1];
      if (prev > 0) returns.push((state.equityCurve[i] - prev) / prev);
    }
    if (returns.length > 0) {
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance =
        returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
      const std = Math.sqrt(variance);
      if (std > 0)
        sharpeRatio =
          (mean / std) * Math.sqrt(Math.min(252, returns.length));
    }
  }

  return {
    totalPnl,
    totalPnlPercent,
    maxDrawdownPercent: maxDDPct,
    maxDrawdown: peak - state.equity,
    sharpeRatio,
    sortinoRatio: 0,
    tradeCount: state.tradeCount,
    winRate: 0,
    winCount: 0,
    lossCount: 0,
    avgWin: 0,
    avgLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    profitFactor: 0,
    calmarRatio: 0,
    avgRMultiple: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    finalBalance: state.balance,
    finalEquity: state.equity,
    totalFees: state.totalFees,
    totalSlippage: state.totalSlippage,
    fills: state.fills,
    equityCurve: state.equityCurve,
    stateHash: '',
    eventCount: 0,
    candleCount: state.equityCurve.length - 1
  };
}

export function ScoreProgressPanel({
  engineState,
  scoringConfig,
  initialBalance
}: ScoreProgressPanelProps) {
  const { t } = useTranslation();

  const scoreResult = useMemo(() => {
    try {
      const partial = buildPartialResult(engineState, initialBalance);
      return scoreSimulation(partial, scoringConfig);
    } catch {
      return null;
    }
  }, [engineState, scoringConfig, initialBalance]);

  if (!scoreResult) return null;

  const score = scoreResult.score;
  const passed = scoreResult.passed;
  const pnlPct =
    ((engineState.equity - initialBalance) / initialBalance) * 100;
  const ddPct = (() => {
    let peak = initialBalance;
    let maxDD = 0;
    for (const eq of engineState.equityCurve) {
      if (eq > peak) peak = eq;
      const dd = peak > 0 ? ((peak - eq) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  })();

  const pnlOk = pnlPct >= scoringConfig.passingPnlPercent;
  const ddOk = ddPct <= scoringConfig.maxDrawdownPercent;
  const tradesOk = engineState.tradeCount >= scoringConfig.minTradeCount;

  const scoreColor =
    score >= 70
      ? 'text-emerald-400'
      : score >= 40
        ? 'text-yellow-400'
        : 'text-red-400';

  const barColor =
    score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
      {/* Score gauge */}
      <div className="flex flex-col items-center min-w-[48px]">
        <span className="text-[10px] text-muted-foreground leading-none mb-0.5">
          {t('sim.scorePanel.title')}
        </span>
        <span className={cn('text-base font-bold font-mono leading-none', scoreColor)}>
          {score}
        </span>
        <span className="text-[9px] text-muted-foreground">/100</span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', barColor)}
            style={{ width: `${Math.min(100, score)}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('sim.playback.progressAriaLabel', { pct: score.toFixed(0) })}
          />
        </div>

        {/* Criteria badges */}
        <div className="flex gap-1.5 mt-1">
          <span
            className={cn(
              'rounded px-1 py-0.5 text-[9px] font-medium',
              pnlOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            )}
          >
            {t('sim.scorePanel.pnlLabel')} {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
          </span>
          <span
            className={cn(
              'rounded px-1 py-0.5 text-[9px] font-medium',
              ddOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            )}
          >
            {t('sim.scorePanel.ddLabel')} {ddPct.toFixed(1)}%
          </span>
          <span
            className={cn(
              'rounded px-1 py-0.5 text-[9px] font-medium',
              tradesOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
            )}
          >
            {t('sim.scorePanel.tradesLabel')} {engineState.tradeCount}/{scoringConfig.minTradeCount}
          </span>
        </div>
      </div>

      {/* Status pill */}
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
          passed
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {passed ? t('sim.scorePanel.onTrack') : t('sim.scorePanel.offTrack')}
      </span>
    </div>
  );
}
