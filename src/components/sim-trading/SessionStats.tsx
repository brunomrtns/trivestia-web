import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { SimulationState } from '@/types/api';

interface SessionStatsProps {
  engineState: SimulationState;
  initialBalance: number;
}

export function SessionStats({ engineState, initialBalance }: SessionStatsProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const { equity } = engineState;
    const totalTrades = engineState.tradeCount;
    const currentPnL = equity - initialBalance;
    const pnlPct = (currentPnL / initialBalance) * 100;

    return {
      totalTrades,
      currentPnL,
      pnlPct
    };
  }, [engineState, initialBalance]);

  return (
    <div className="rounded-xl border border-border bg-background/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t('sim.stats.sessionPerformance')}
        </span>
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('sim.stats.totalTrades')}</span>
          <span className="text-xs font-mono font-bold">{stats.totalTrades}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('sim.stats.totalPnl')}</span>
          <div className="flex flex-col items-end">
            <span className={cn('text-xs font-mono font-bold', stats.currentPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {stats.currentPnL >= 0 ? '+' : ''}${Math.abs(stats.currentPnL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={cn('text-[10px] font-mono font-medium opacity-80', stats.currentPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {stats.pnlPct >= 0 ? '+' : ''}{stats.pnlPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
