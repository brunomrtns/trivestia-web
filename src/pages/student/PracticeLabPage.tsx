import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { BarChart2, History, TrendingUp } from 'lucide-react';
import { SimTradingTerminal } from '@/components/sim-trading/SimTradingTerminal';
import { simulationEndpoints } from '@/services/endpoints/simulation.endpoints';
import type { Candle, ScenarioPayload } from '@/types/api';
import { useTranslation } from 'react-i18next';

// ─── Config Form ──────────────────────────────────────────────────────────────

const configSchema = z.object({
  numCandles: z.coerce.number().int().min(50).max(500).default(200),
  timeframeMs: z.coerce.number().default(300_000),
  volatility: z.coerce.number().min(0.0001).max(0.1).default(0.015),
  trend: z.coerce.number().min(-1).max(1).default(0),
  spreadBps: z.coerce.number().int().min(1).max(200).default(10),
  initialBalance: z.coerce.number().min(100).max(1_000_000).default(10_000)
});
type ConfigForm = z.infer<typeof configSchema>;

const TIMEFRAMES = [
  { label: '1 min', value: 60_000 },
  { label: '5 min', value: 300_000 },
  { label: '15 min', value: 900_000 },
  { label: '1 hora', value: 3_600_000 }
];

// ─── Page ─────────────────────────────────────────────────────────────────────

type Phase = 'hub' | 'terminal';

export default function PracticeLabPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const [phase, setPhase] = useState<Phase>('hub');
  const [practiceToken, setPracticeToken] = useState<string>('');
  const [practiceCandles, setPracticeCandles] = useState<Candle[]>([]);
  const [practiceScenario, setPracticeScenario] =
    useState<ScenarioPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      numCandles: 200,
      timeframeMs: 300_000,
      volatility: 0.015,
      trend: 0,
      spreadBps: 10,
      initialBalance: 10_000
    }
  });

  const onStart = async (data: ConfigForm) => {
    setLoading(true);
    try {
      const res = await simulationEndpoints.createPracticeScenario(slug, data);
      // Backend retorna { sessionId, candles, executionConfig, scenarioToken, maxEvents }
      // Montar ScenarioPayload para o hook
      const scenario: ScenarioPayload = {
        scenarioId: res.sessionId,
        candles: res.candles,
        executionConfig: res.executionConfig,
        scenarioToken: res.scenarioToken,
        maxEvents: res.maxEvents
      };
      setPracticeToken(res.scenarioToken);
      setPracticeCandles(res.candles);
      setPracticeScenario(scenario);
      setPhase('terminal');
    } catch {
      toast.error(t('app.lab.toast.error'));
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'terminal' && practiceToken && practiceScenario) {
    return (
      <SimTradingTerminal
        slug={slug}
        mode="PRACTICE"
        practiceToken={practiceToken}
        practiceCandles={practiceCandles}
        practiceScenario={practiceScenario}
        onComplete={() => setPhase('hub')}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('app.lab.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('app.lab.subtitle')}
          </p>
        </div>
        <Link
          to={`/t/${slug}/app/lab/history`}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
        >
          <History className="h-3.5 w-3.5" />
          {t('app.lab.historyLink')}
        </Link>
      </div>

      {/* Config Form */}
      <form
        onSubmit={handleSubmit(onStart)}
        className="space-y-5 rounded-xl border bg-card p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('app.lab.form.title')}
        </h2>

        {/* Candles + Timeframe */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('app.lab.form.candles')}
            </label>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('numCandles')}
            />
            {errors.numCandles && (
              <p className="mt-1 text-xs text-destructive">
                {errors.numCandles.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('app.lab.form.timeframe')}
            </label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('timeframeMs')}
            >
              {TIMEFRAMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Volatilidade + Trend */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('app.lab.form.volatility')}
            </label>
            <input
              type="number"
              step="0.001"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('volatility')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('app.lab.form.trend')}
            </label>
            <input
              type="number"
              step="0.1"
              min="-1"
              max="1"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('trend')}
            />
          </div>
        </div>

        {/* Spread + Saldo */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('app.lab.form.spread')}
            </label>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('spreadBps')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('app.lab.form.balance')}
            </label>
            <input
              type="number"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('initialBalance')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          <TrendingUp className="h-4 w-4" />
          {loading ? t('app.lab.form.submitLoading') : t('app.lab.form.submit')}
        </button>
      </form>
    </div>
  );
}
