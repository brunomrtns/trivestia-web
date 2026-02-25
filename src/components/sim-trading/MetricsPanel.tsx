import { cn } from '@/lib/utils';
import type { SimulationResult } from '@/types/api';

interface MetricsPanelProps {
  result?: SimulationResult | null;
}

export function MetricsPanel({ result }: MetricsPanelProps) {
  if (!result) {
    return (
      <div className="text-xs text-muted-foreground py-2 px-1">
        Métricas disponíveis ao finalizar
      </div>
    );
  }

  const rows = [
    { label: 'Trades', value: result.tradeCount },
    { label: 'Ganhos', value: result.winCount },
    { label: 'Perdas', value: result.lossCount },
    {
      label: 'Win Rate',
      value: `${result.winRate.toFixed(1)}%`,
      color: result.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'
    },
    {
      label: 'Sharpe',
      value: result.sharpeRatio.toFixed(2),
      color:
        result.sharpeRatio >= 1
          ? 'text-emerald-400'
          : result.sharpeRatio >= 0
            ? 'text-yellow-400'
            : 'text-red-400'
    },
    {
      label: 'Max DD',
      value: `${result.maxDrawdownPercent.toFixed(2)}%`,
      color:
        result.maxDrawdownPercent < 10 ? 'text-emerald-400' : 'text-red-400'
    },
    { label: 'Fees Total', value: `$${result.totalFees.toFixed(2)}` },
    { label: 'Eventos', value: result.eventCount }
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1 py-2 text-xs sm:grid-cols-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="text-muted-foreground">{r.label}</div>
          <div
            className={cn(
              'font-mono font-semibold',
              r.color ?? 'text-foreground'
            )}
          >
            {String(r.value)}
          </div>
        </div>
      ))}
    </div>
  );
}
