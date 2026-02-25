import { cn } from '@/lib/utils';
import type { Fill } from '@/types/api';

interface FillsPanelProps {
  fills: Fill[];
}

export function FillsPanel({ fills }: FillsPanelProps) {
  if (fills.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2 px-1">
        Nenhum preenchimento ainda
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto">
      {[...fills].reverse().map((f, i) => (
        <div
          key={`${f.orderId}-${i}`}
          className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs"
        >
          <span
            className={cn(
              'font-semibold',
              f.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {f.side}
          </span>
          <span className="font-mono">{f.quantity}</span>
          <span className="font-mono">@ {f.fillPrice.toFixed(2)}</span>
          <span className="ml-auto text-muted-foreground text-[10px]">
            C{f.candleIndex} · {f.reason}
          </span>
          {f.fee > 0 && (
            <span className="text-[10px] text-orange-400">
              fee {f.fee.toFixed(2)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
