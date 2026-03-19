import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      label: t('sim.accountSummary.balance'),
      value: `$${engineState.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-foreground'
    },
    {
      label: t('sim.accountSummary.equity'),
      value: `$${engineState.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'text-foreground'
    },
    {
      label: t('sim.accountSummary.pnl'),
      value: `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subValue: `(${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`,
      color: pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
    },
    {
      label: t('sim.accountSummary.fees'),
      value: `$${fees.toFixed(2)}`,
      color: 'text-muted-foreground'
    },
    {
      label: t('sim.accountSummary.maxDD'),
      value: `${maxDDPct.toFixed(2)}%`,
      color: 'text-yellow-500/80'
    }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap rounded-lg border border-border/60 bg-background/40 px-2 py-1.5">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/80">
            {item.label}
          </span>
          <span className={cn('font-mono text-[11px] font-bold tracking-tight', item.color)}>
            {item.value}
          </span>
          {item.subValue && (
            <span className={cn('font-mono text-[10px] font-medium opacity-80', item.color)}>
              {item.subValue}
            </span>
          )}
          {index < items.length - 1 && (
            <span className="ml-1 text-border">|</span>
          )}
        </div>
      ))}
    </div>
  );
}
