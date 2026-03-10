import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, BookOpen, Eye } from 'lucide-react';
import { simulationEndpoints } from '@/services/endpoints/simulation.endpoints';
import { CandlesChart } from '@/components/sim-trading/CandlesChart';
import { MetricsPanel } from '@/components/sim-trading/MetricsPanel';
import { useIndicators } from '@/components/sim-trading/useIndicators';
import { cn } from '@/lib/utils';

export default function PracticeReplayPage() {
  const { t } = useTranslation();
  const { tenantSlug, sessionId } = useParams<{
    tenantSlug: string;
    sessionId: string;
  }>();
  const slug = tenantSlug ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['practice-session', slug, sessionId],
    queryFn: () => simulationEndpoints.getSession(slug, sessionId!),
    enabled: !!sessionId
  });

  const indicators = useIndicators(data?.candles ?? []);

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-xl py-16 px-4 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <p className="mb-6 text-sm text-muted-foreground">
          {t('sim.replay.loadError')}
        </p>
        <Link
          to={`/t/${slug}/app/lab/history`}
          className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('sim.replay.backButton')}
        </Link>
      </div>
    );
  }

  const { candles, result, createdAt } = data;
  const totalCandles = candles.length;

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(createdAt));

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-2">
        <Link
          to={`/t/${slug}/app/lab/history`}
          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('sim.replay.backButton')}
        </Link>

        <div className="flex flex-1 items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h1 className="truncate text-sm font-semibold">
            {t('sim.replay.title')}
          </h1>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            — {formattedDate}
          </span>
        </div>

        {/* Read-only badge */}
        <div className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
          <Eye className="h-3 w-3" />
          {t('sim.replay.readOnly')}
        </div>

        {/* Indicator toggles */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            onClick={indicators.toggleMA}
            className={cn(
              'rounded border px-2 py-1 text-xs font-medium transition',
              indicators.state.ma.enabled
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-400'
                : 'border-border text-muted-foreground hover:bg-accent'
            )}
          >
            MM{indicators.state.ma.enabled ? ` ${indicators.state.ma.period}` : ''}
          </button>
          <button
            onClick={indicators.toggleEMA}
            className={cn(
              'rounded border px-2 py-1 text-xs font-medium transition',
              indicators.state.ema.enabled
                ? 'border-violet-500/60 bg-violet-500/15 text-violet-400'
                : 'border-border text-muted-foreground hover:bg-accent'
            )}
          >
            MME{indicators.state.ema.enabled ? ` ${indicators.state.ema.period}` : ''}
          </button>
          <button
            onClick={indicators.toggleRSI}
            className={cn(
              'rounded border px-2 py-1 text-xs font-medium transition',
              indicators.state.rsi.enabled
                ? 'border-blue-500/60 bg-blue-500/15 text-blue-400'
                : 'border-border text-muted-foreground hover:bg-accent'
            )}
          >
            RSI{indicators.state.rsi.enabled ? ` ${indicators.state.rsi.period}` : ''}
          </button>
        </div>
      </div>

      {/* ── Main body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chart area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <CandlesChart
            candles={candles}
            visibleCount={totalCandles}
            maSeries={indicators.maSeries}
            emaSeries={indicators.emaSeries}
            rsiSeries={indicators.rsiSeries}
          />
        </div>

        {/* Right panel: metrics */}
        <div className="hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l bg-background p-4 lg:flex">
          {/* Candle info */}
          <div className="rounded-lg border bg-card p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('sim.replay.title')}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalCandles}{' '}
              {t('sim.metrics.trades').replace('Trades', 'candles')}
            </p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>

          {/* Metrics */}
          {result ? (
            <div className="rounded-lg border bg-card p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('sim.result.title', 'Resultado')}
              </p>
              <MetricsPanel result={result} />
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-4 text-center text-xs text-muted-foreground">
              {t('sim.replay.noResult')}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom metrics strip (mobile / tablet) ─────────────────────────── */}
      {result && (
        <div className="shrink-0 border-t bg-background lg:hidden">
          <div className="overflow-x-auto px-4 py-2">
            <div className="flex items-center gap-4 text-xs whitespace-nowrap">
              <span className="text-muted-foreground">{t('sim.metrics.trades')}:</span>
              <span className="font-mono font-semibold">{result.tradeCount}</span>
              <span className="text-muted-foreground">{t('sim.metrics.winRate')}:</span>
              <span
                className={cn(
                  'font-mono font-semibold',
                  result.winRate >= 0.5 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {(result.winRate * 100).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">PnL:</span>
              <span
                className={cn(
                  'font-mono font-semibold',
                  result.totalPnlPercent > 0
                    ? 'text-emerald-400'
                    : result.totalPnlPercent < 0
                      ? 'text-red-400'
                      : 'text-foreground'
                )}
              >
                {result.totalPnlPercent > 0 ? '+' : ''}
                {result.totalPnlPercent.toFixed(2)}%
              </span>
              <span className="text-muted-foreground">DD:</span>
              <span className="font-mono font-semibold text-red-400">
                {result.maxDrawdownPercent.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">Sharpe:</span>
              <span className="font-mono font-semibold">
                {result.sharpeRatio.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
