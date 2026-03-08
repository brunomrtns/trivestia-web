import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderSide, OrderType } from '@/types/api';

type OrderFormValues = {
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  quantity: number;
  price?: number;
  sl?: number;
  tp?: number;
};

interface OrderTicketProps {
  onPlaceOrder: (order: {
    id: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    sl?: number;
    tp?: number;
  }) => void;
  disabled?: boolean;
  currentPrice?: number;
}

export function OrderTicket({
  onPlaceOrder,
  disabled,
  currentPrice
}: OrderTicketProps) {
  const { t } = useTranslation();
  const [useSl, setUseSl] = useState(false);
  const [useTp, setUseTp] = useState(false);

  const schema = z
    .object({
      side: z.enum(['BUY', 'SELL']),
      type: z.enum(['MARKET', 'LIMIT', 'STOP']),
      quantity: z.coerce
        .number()
        .positive(t('sim.orderTicket.validation.quantity')),
      price: z.coerce.number().optional(),
      sl: z.coerce.number().optional(),
      tp: z.coerce.number().optional()
    })
    .refine(
      (d) => d.type === 'MARKET' || (d.price !== undefined && d.price > 0),
      { message: t('sim.orderTicket.validation.price'), path: ['price'] }
    );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<OrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { side: 'BUY', type: 'MARKET', quantity: 1 }
  });

  const side = watch('side');
  const type = watch('type');

  const onSubmit = (data: OrderFormValues) => {
    onPlaceOrder({
      id: crypto.randomUUID(),
      side: data.side as OrderSide,
      type: data.type as OrderType,
      quantity: data.quantity,
      ...(data.price !== undefined && data.type !== 'MARKET'
        ? { price: data.price }
        : {}),
      ...(useSl && data.sl ? { sl: data.sl } : {}),
      ...(useTp && data.tp ? { tp: data.tp } : {})
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm"
    >
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {t('sim.orderTicket.title')}
        {currentPrice !== undefined && (
          <span className="ml-2 font-mono text-foreground">
            @ {currentPrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Side */}
      <div className="grid grid-cols-2 gap-1">
        {(['BUY', 'SELL'] as const).map((s) => (
          <label
            key={s}
            className={cn(
              'flex cursor-pointer items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-semibold transition-colors',
              side === s
                ? s === 'BUY'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-red-500 bg-red-500/20 text-red-400'
                : 'border-border text-muted-foreground hover:bg-accent'
            )}
          >
            <input
              type="radio"
              value={s}
              className="sr-only"
              {...register('side')}
            />
            {s === 'BUY' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {s}
          </label>
        ))}
      </div>

      {/* Type */}
      <div className="grid grid-cols-3 gap-1">
        {(['MARKET', 'LIMIT', 'STOP'] as const).map((t) => (
          <label
            key={t}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-md border py-1 text-xs font-medium transition-colors',
              type === t
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent'
            )}
          >
            <input
              type="radio"
              value={t}
              className="sr-only"
              {...register('type')}
            />
            {t}
          </label>
        ))}
      </div>

      {/* Quantity */}
      <div>
        <label className="text-xs text-muted-foreground">
          {t('sim.orderTicket.quantityLabel')}
        </label>
        <input
          type="number"
          step="0.01"
          className="mt-0.5 w-full rounded-md border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          {...register('quantity')}
        />
        {errors.quantity && (
          <p className="mt-0.5 text-xs text-destructive">
            {errors.quantity.message}
          </p>
        )}
      </div>

      {/* Price (LIMIT/STOP only) */}
      {type !== 'MARKET' && (
        <div>
          <label className="text-xs text-muted-foreground">
            {t('sim.orderTicket.priceLabel')}
          </label>
          <input
            type="number"
            step="0.01"
            className="mt-0.5 w-full rounded-md border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            {...register('price')}
          />
          {errors.price && (
            <p className="mt-0.5 text-xs text-destructive">
              {errors.price.message}
            </p>
          )}
        </div>
      )}

      {/* SL/TP toggles */}
      <div className="flex gap-2">
        <label className="flex cursor-pointer items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={useSl}
            onChange={(e) => setUseSl(e.target.checked)}
            className="h-3 w-3"
          />
          {t('sim.orderTicket.slLabel')}
        </label>
        <label className="flex cursor-pointer items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={useTp}
            onChange={(e) => setUseTp(e.target.checked)}
            className="h-3 w-3"
          />
          {t('sim.orderTicket.tpLabel')}
        </label>
      </div>

      {useSl && (
        <div>
          <label className="text-xs text-muted-foreground">
            {t('sim.orderTicket.slShortLabel')}
          </label>
          <input
            type="number"
            step="0.01"
            className="mt-0.5 w-full rounded-md border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-destructive"
            {...register('sl')}
          />
        </div>
      )}

      {useTp && (
        <div>
          <label className="text-xs text-muted-foreground">
            {t('sim.orderTicket.tpShortLabel')}
          </label>
          <input
            type="number"
            step="0.01"
            className="mt-0.5 w-full rounded-md border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            {...register('tp')}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={disabled}
        className={cn(
          'mt-1 flex w-full items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-colors',
          side === 'BUY'
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
            : 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-50'
        )}
      >
        {disabled ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : side === 'BUY' ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}
        {side === 'BUY'
          ? t('sim.orderTicket.buyButton')
          : t('sim.orderTicket.sellButton')}
      </button>
    </form>
  );
}
