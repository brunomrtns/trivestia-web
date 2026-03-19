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
      value: `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subValue: `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`,
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
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {item.label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={cn('font-mono text-sm font-bold tracking-tight', item.color)}>
              {item.value}
            </span>
            {item.subValue && (
              <span className={cn('font-mono text-[10px] font-medium opacity-80', item.color)}>
                {item.subValue}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
