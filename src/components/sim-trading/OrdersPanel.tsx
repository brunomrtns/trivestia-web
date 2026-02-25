import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulationState } from '@/types/api';

interface OrdersPanelProps {
  engineState: SimulationState;
  onCancel: (orderId: string) => void;
  disabled?: boolean;
}

export function OrdersPanel({
  engineState,
  onCancel,
  disabled
}: OrdersPanelProps) {
  const orders = engineState.openOrders ?? [];

  if (orders.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2 px-1">
        Nenhuma ordem pendente
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {orders.map((o) => (
        <div
          key={o.id}
          className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs"
        >
          <span
            className={cn(
              'font-semibold',
              o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {o.side}
          </span>
          <span className="text-muted-foreground">{o.type}</span>
          <span className="font-mono">{o.quantity}</span>
          {o.price !== undefined && (
            <span className="font-mono text-muted-foreground">
              @ {o.price.toFixed(2)}
            </span>
          )}
          <span className="ml-auto text-muted-foreground">
            C{o.candleIndex}
          </span>
          <button
            onClick={() => onCancel(o.id)}
            disabled={disabled}
            className="rounded p-0.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive disabled:opacity-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
