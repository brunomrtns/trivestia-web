import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { CreateQuestionDTO } from '@/types/api';

// ─── Schema ───────────────────────────────────────────────────────────────────

// SimForm type — schema is defined inside the component to allow t()
type SimForm = {
  numCandles: number;
  timeframeMinutes: number;
  startPrice: number;
  volatility: number;
  trend: number;
  spreadBps: number;
  initialBalance: number;
  feeBps: number;
  maxLeverage: number;
  maxPositionSize: number;
  allowShort: boolean;
  passingPnlPercent: number;
  maxAllowedDrawdownPercent: number;
  minTradeCount: number;
  weightPnl: number;
  weightDrawdown: number;
  weightSharpe: number;
  weightWinRate: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialData?: Record<string, unknown>;
  onSave: (data: CreateQuestionDTO) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const FIELD =
  'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring';
const LABEL = 'mb-1 block text-xs font-medium text-muted-foreground';

export function SimTradingQuestionForm({
  initialData,
  onSave,
  onCancel,
  loading
}: Props) {
  const { t } = useTranslation();

  const simSchema = z.object({
    // CandleConfig
    numCandles: z.coerce.number().int().min(50).max(500).default(200),
    timeframeMinutes: z.coerce
      .number()
      .refine((v) => [1, 5, 15, 60, 240].includes(v), {
        message: t('admin.simForm.validation.timeframe')
      })
      .default(5),
    startPrice: z.coerce.number().min(0.01).default(100),
    volatility: z.coerce.number().min(0.0001).max(0.15).default(0.015),
    trend: z.coerce.number().min(-1).max(1).default(0),
    spreadBps: z.coerce.number().int().min(1).max(200).default(10),

    // ExecutionConfig
    initialBalance: z.coerce.number().min(100).max(1_000_000).default(10_000),
    feeBps: z.coerce.number().min(0).max(100).default(5),
    maxLeverage: z.coerce.number().min(1).max(100).default(1),
    maxPositionSize: z.coerce.number().min(1).max(100).default(100),
    allowShort: z.boolean().default(true),

    // ScoringConfig
    passingPnlPercent: z.coerce.number().min(0).default(2),
    maxAllowedDrawdownPercent: z.coerce.number().min(1).max(100).default(20),
    minTradeCount: z.coerce.number().int().min(1).default(3),

    // Weights
    weightPnl: z.coerce.number().min(0).max(100).default(40),
    weightDrawdown: z.coerce.number().min(0).max(100).default(20),
    weightSharpe: z.coerce.number().min(0).max(100).default(20),
    weightWinRate: z.coerce.number().min(0).max(100).default(20)
  });

  const cfg = initialData as Record<string, unknown> | undefined;
  const cc = cfg?.candleConfig as Record<string, unknown> | undefined;
  const ec = cfg?.executionConfig as Record<string, unknown> | undefined;
  const sc = cfg?.scoringConfig as Record<string, unknown> | undefined;
  const sw = sc?.weights as Record<string, unknown> | undefined;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SimForm>({
    resolver: zodResolver(simSchema),
    defaultValues: {
      numCandles: (cc?.numCandles as number) ?? 200,
      timeframeMinutes: cc?.timeframeMs
        ? (cc.timeframeMs as number) / 60_000
        : 5,
      startPrice: (cc?.startPrice as number) ?? 100,
      volatility: (cc?.volatility as number) ?? 0.015,
      trend: (cc?.trend as number) ?? 0,
      spreadBps: (cc?.spreadBps as number) ?? 10,
      initialBalance: (ec?.initialBalance as number) ?? 10_000,
      feeBps: (ec?.feeBps as number) ?? 5,
      maxLeverage: (ec?.maxLeverage as number) ?? 1,
      maxPositionSize: (ec?.maxPositionSize as number) ?? 100,
      allowShort: (ec?.allowShort as boolean) ?? true,
      passingPnlPercent: (sc?.passingPnlPercent as number) ?? 2,
      maxAllowedDrawdownPercent: (sc?.maxDrawdownPercent as number) ?? 20,
      minTradeCount: (sc?.minTradeCount as number) ?? 3,
      weightPnl: (sw?.pnl as number) ?? 40,
      weightDrawdown: (sw?.drawdown as number) ?? 20,
      weightSharpe: (sw?.sharpe as number) ?? 20,
      weightWinRate: (sw?.winRate as number) ?? 20
    }
  });

  const onSubmit = async (d: SimForm) => {
    const totalWeight =
      d.weightPnl + d.weightDrawdown + d.weightSharpe + d.weightWinRate;
    const normalize = (w: number) => +(w / totalWeight).toFixed(4);

    const jsonData = {
      candleConfig: {
        numCandles: d.numCandles,
        timeframeMs: d.timeframeMinutes * 60_000,
        startPrice: d.startPrice,
        volatility: d.volatility,
        trend: d.trend,
        spreadType: 'FIXED',
        spreadBps: d.spreadBps,
        volumeBase: 1000,
        volumeVariance: 0.3
      },
      executionConfig: {
        initialBalance: d.initialBalance,
        feeBps: d.feeBps,
        feeFixed: 0,
        slippageBps: 3,
        maxLeverage: d.maxLeverage,
        maxPositionSize: d.maxPositionSize,
        maxOpenOrders: 5,
        allowShort: d.allowShort
      },
      scoringConfig: {
        passingPnlPercent: d.passingPnlPercent,
        maxDrawdownPercent: d.maxAllowedDrawdownPercent,
        minTradeCount: d.minTradeCount,
        weights: {
          pnl: normalize(d.weightPnl),
          drawdown: normalize(d.weightDrawdown),
          sharpe: normalize(d.weightSharpe),
          winRate: normalize(d.weightWinRate),
          bonus: 0
        }
      }
    };

    await onSave({
      statement: t('admin.simForm.scenarioStatement'),
      difficulty: 3,
      weight: 1,
      options: [],
      metadata: jsonData // backend salva isso como QuestionMetadata.jsonData diretamente
    });
  };

  const err = (field: keyof SimForm) =>
    errors[field] ? (
      <p className="mt-0.5 text-xs text-destructive">
        {errors[field]?.message as string}
      </p>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
          <svg
            className="h-5 w-5 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">{t('admin.simForm.sectionTitle')}</h3>
          <p className="text-xs text-muted-foreground">
            {t('admin.simForm.sectionSubtitle')}
          </p>
        </div>
      </div>

      {/* ── Candles ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('admin.simForm.sections.candles')}
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.numCandles')}
            </label>
            <input
              type="number"
              className={FIELD}
              {...register('numCandles')}
            />
            {err('numCandles')}
          </div>
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.timeframe')}
            </label>
            <select className={FIELD} {...register('timeframeMinutes')}>
              <option value={1}>
                {t('admin.simForm.timeframeOptions.1min')}
              </option>
              <option value={5}>
                {t('admin.simForm.timeframeOptions.5min')}
              </option>
              <option value={15}>
                {t('admin.simForm.timeframeOptions.15min')}
              </option>
              <option value={60}>
                {t('admin.simForm.timeframeOptions.1h')}
              </option>
              <option value={240}>
                {t('admin.simForm.timeframeOptions.4h')}
              </option>
            </select>
          </div>
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.startPrice')}
            </label>
            <input
              type="number"
              step="0.01"
              className={FIELD}
              {...register('startPrice')}
            />
            {err('startPrice')}
          </div>
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.volatility')}
            </label>
            <input
              type="number"
              step="0.001"
              className={FIELD}
              {...register('volatility')}
            />
            {err('volatility')}
          </div>
          <div>
            <label className={LABEL}>{t('admin.simForm.fields.trend')}</label>
            <input
              type="number"
              step="0.05"
              className={FIELD}
              {...register('trend')}
            />
            {err('trend')}
          </div>
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.spreadBps')}
            </label>
            <input type="number" className={FIELD} {...register('spreadBps')} />
            {err('spreadBps')}
          </div>
        </div>
      </section>

      {/* ── Execução ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('admin.simForm.sections.execution')}
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.initialBalance')}
            </label>
            <input
              type="number"
              className={FIELD}
              {...register('initialBalance')}
            />
            {err('initialBalance')}
          </div>
          <div>
            <label className={LABEL}>{t('admin.simForm.fields.feeBps')}</label>
            <input type="number" className={FIELD} {...register('feeBps')} />
            {err('feeBps')}
          </div>
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.maxLeverage')}
            </label>
            <input
              type="number"
              className={FIELD}
              {...register('maxLeverage')}
            />
            {err('maxLeverage')}
          </div>
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.maxPositionSize')}
            </label>
            <input
              type="number"
              className={FIELD}
              {...register('maxPositionSize')}
            />
            {err('maxPositionSize')}
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="allowShort"
              className="h-4 w-4 accent-primary"
              {...register('allowShort')}
            />
            <label htmlFor="allowShort" className="text-sm">
              {t('admin.simForm.fields.allowShort')}
            </label>
          </div>
        </div>
      </section>

      {/* ── Pontuação ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('admin.simForm.sections.scoring')}
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.passingPnl')}
            </label>
            <input
              type="number"
              step="0.1"
              className={FIELD}
              {...register('passingPnlPercent')}
            />
            {err('passingPnlPercent')}
          </div>
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.maxDrawdown')}
            </label>
            <input
              type="number"
              step="0.5"
              className={FIELD}
              {...register('maxAllowedDrawdownPercent')}
            />
            {err('maxAllowedDrawdownPercent')}
          </div>
          <div>
            <label className={LABEL}>
              {t('admin.simForm.fields.minTradeCount')}
            </label>
            <input
              type="number"
              className={FIELD}
              {...register('minTradeCount')}
            />
            {err('minTradeCount')}
          </div>
        </div>
      </section>

      {/* ── Pesos ── */}
      <section className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('admin.simForm.sections.weights')}{' '}
          <span className="normal-case font-normal">
            ({t('admin.simForm.weightsNormalized')})
          </span>
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: t('admin.simForm.fields.weightPnl'),
              field: 'weightPnl' as const
            },
            {
              label: t('admin.simForm.fields.weightDrawdown'),
              field: 'weightDrawdown' as const
            },
            {
              label: t('admin.simForm.fields.weightSharpe'),
              field: 'weightSharpe' as const
            },
            {
              label: t('admin.simForm.fields.weightWinRate'),
              field: 'weightWinRate' as const
            }
          ].map(({ label, field }) => (
            <div key={field}>
              <label className={LABEL}>{label}</label>
              <input
                type="number"
                min={0}
                className={FIELD}
                {...register(field)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('admin.simForm.saveButton')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          {t('common.actions.cancel')}
        </button>
      </div>
    </form>
  );
}
