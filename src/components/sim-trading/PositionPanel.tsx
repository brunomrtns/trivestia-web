import { TrendingDown, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Position } from '@/types/api';

interface PositionPanelProps {
  position: Position;
  onClose: () => void;
  disabled?: boolean;
}

export function PositionPanel({
  position,
  onClose,
  disabled
}: PositionPanelProps) {
  if (position.side === 'FLAT') {
    return (
      <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground">
        Sem posição aberta
      </div>
    );
  }

  const isLong = position.side === 'LONG';
  const pnl = position.unrealizedPnl;

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {isLong ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          )}
          <span className={isLong ? 'text-emerald-400' : 'text-red-400'}>
            {position.side}
          </span>
        </div>
        <button
          onClick={onClose}
          disabled={disabled}
          className="rounded p-0.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive disabled:opacity-50"
          title="Fechar posição"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div className="text-muted-foreground">Qty</div>
        <div className="font-mono">{position.quantity}</div>

        <div className="text-muted-foreground">Entry</div>
        <div className="font-mono">{position.entryPrice.toFixed(2)}</div>

        <div className="text-muted-foreground">PnL não realizado</div>
        <div
          className={cn(
            'font-mono font-semibold',
            pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {pnl >= 0 ? '+' : ''}
          {pnl.toFixed(2)}
        </div>

        <div className="text-muted-foreground">PnL realizado</div>
        <div
          className={cn(
            'font-mono',
            position.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {position.realizedPnl >= 0 ? '+' : ''}
          {position.realizedPnl.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
