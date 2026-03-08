import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { simulationEndpoints } from '@/services/endpoints/simulation.endpoints';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function PracticeHistoryPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['practice-history', slug, page],
    queryFn: () => simulationEndpoints.getPracticeHistory(slug, page, 10)
  });

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/t/${slug}/app/lab`}
          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('app.practiceHistory.backToLab')}
        </Link>
        <h1 className="text-xl font-bold">{t('app.practiceHistory.title')}</h1>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !data || data.sessions.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('app.practiceHistory.empty')}{' '}
          <Link
            to={`/t/${slug}/app/lab`}
            className="text-primary hover:underline"
          >
            {t('common.actions.startNow')}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.sessions.map((session) => {
              const r = session.result;
              const pnlPct = r?.totalPnlPercent ?? 0;
              const positive = pnlPct > 0;
              const neutral = pnlPct === 0;
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                      !r
                        ? 'bg-muted'
                        : positive
                          ? 'bg-emerald-500/15'
                          : neutral
                            ? 'bg-muted'
                            : 'bg-red-500/15'
                    )}
                  >
                    {!r ? (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    ) : positive ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : neutral ? (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="flex-1 min-w-0">
                    {r ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={cn(
                            'text-sm font-mono font-semibold',
                            positive
                              ? 'text-emerald-400'
                              : neutral
                                ? 'text-foreground'
                                : 'text-red-400'
                          )}
                        >
                          {positive ? '+' : ''}
                          {pnlPct.toFixed(2)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.tradeCount} trades
                        </span>
                        <span className="text-xs text-muted-foreground">
                          WR {r.winRate.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          DD {r.maxDrawdownPercent.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t('app.practiceHistory.noResult')}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(session.createdAt))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 font-medium transition hover:bg-accent disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.pagination.previous')}
              </button>
              <span className="text-muted-foreground">
                {page} / {data.pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.pages, p + 1))
                }
                disabled={page === data.pagination.pages}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 font-medium transition hover:bg-accent disabled:opacity-40"
              >
                {t('common.pagination.next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
