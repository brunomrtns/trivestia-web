import { cn } from '@/lib/utils';
import type { SimulationState } from '@/types/api';

interface AccountSummaryProps {
  engineState: SimulationState;
  initialBalance: number;
}

export function AccountSummary({
  engineState,
  initialBalance
}: AccountSummaryProps) {
  const pnl = engineState.equity - initialBalance;
  const pnlPct = (pnl / initialBalance) * 100;
  const fees = engineState.totalFees ?? 0;

  // Calcula max drawdown a partir da curva de equity
  const maxDDPct = (() => {
    const curve = engineState.equityCurve ?? [];
    let peak = initialBalance;
    let maxDD = 0;
    for (const eq of curve) {
      if (eq > peak) peak = eq;
      const dd = peak > 0 ? ((peak - eq) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  })();

  const items = [
    {
      label: 'Saldo',
      value: `$${engineState.balance.toFixed(2)}`,
      color: 'text-foreground'
    },
    {
      label: 'Equity',
      value: `$${engineState.equity.toFixed(2)}`,
      color: 'text-foreground'
    },
    {
      label: 'PnL',
      value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`,
      color: pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
    },
    {
      label: 'Fees',
      value: `$${fees.toFixed(2)}`,
      color: 'text-orange-400'
    },
    {
      label: 'DD Máx',
      value: `${maxDDPct.toFixed(2)}%`,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border bg-card px-4 py-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">{item.label}:</span>
          <span className={cn('font-mono font-semibold', item.color)}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
