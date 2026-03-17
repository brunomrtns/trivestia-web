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
    const { fills, equity } = engineState;
    const totalTrades = engineState.tradeCount;
    const currentPnL = equity - initialBalance;
    const pnlPct = (currentPnL / initialBalance) * 100;

    // Calculate win rate from fills (assuming each exit fill counts as a trade outcome)
    // Professional way: matching entry/exit. 
    // Simplified for live stats: count fills with realized PnL > 0.
    // Actually, let's just look at the trade results if available.
    
    // For now, let's show what we have in SimulationState
    return {
      totalTrades,
      currentPnL,
      pnlPct,
      winRate: 0, // Need more logic to calculate correctly from raw fills
      avgR: 0     // Need initial risk per trade
    };
  }, [engineState, initialBalance]);

  const items = [
    {
      label: t('sim.stats.totalTrades'),
      value: stats.totalTrades,
      color: 'text-foreground'
    },
    {
      label: t('sim.stats.totalPnl'),
      value: `${stats.currentPnL >= 0 ? '+' : ''}$${stats.currentPnL.toFixed(2)} (${stats.pnlPct.toFixed(2)}%)`,
      color: stats.currentPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
    },
    // We can add more if logic allows
  ];

  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border bg-card/50 p-4 backdrop-blur-sm sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {item.label}
          </span>
          <span className={cn('font-mono text-sm font-bold', item.color)}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
