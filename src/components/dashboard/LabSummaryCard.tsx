import { motion } from 'framer-motion';
import {
  BarChart2,
  TrendingUp,
  Trophy,
  Target,
  TrendingDown,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { tenantPath } from '@/lib/tenant';
import type { DashboardLabSummaryDTO } from '@/types/api';
import { useTranslation } from 'react-i18next';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function LabSummaryCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border bg-muted/30 p-4 h-20"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Mini-stat ────────────────────────────────────────────────────────────────

interface MiniStatProps {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}

function MiniStat({
  icon: Icon,
  label,
  value,
  valueClass = ''
}: MiniStatProps) {
  return (
    <div className="rounded-xl border bg-card/60 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
      <p className={`text-xl font-extrabold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LabSummaryCardProps {
  data: DashboardLabSummaryDTO;
  slug: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LabSummaryCard({ data, slug }: LabSummaryCardProps) {
  const { t } = useTranslation();
  const {
    totalSessions,
    completedSessions,
    avgPnlPercent,
    bestPnlPercent,
    avgWinRate,
    avgMaxDrawdown,
    lastSessionAt
  } = data;

  // ── Empty state ───────────────────────────────────────────────────────────
  if (totalSessions === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-card p-6 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <BarChart2 className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="font-semibold">{t('app.labSummary.empty.title')}</p>
            <p className="text-sm text-muted-foreground">
              {t('app.labSummary.empty.subtitle')}
            </p>
          </div>
        </div>
        <Link
          to={tenantPath(slug, '/app/lab')}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
        >
          {t('app.labSummary.empty.button')} <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    );
  }

  // ── Cor condicional do PnL ────────────────────────────────────────────────
  const pnlColor = (v: number) =>
    v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : '';

  // ── Formatar última sessão ────────────────────────────────────────────────
  const lastAt = lastSessionAt
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short'
      }).format(new Date(lastSessionAt))
    : '—';

  const stats: MiniStatProps[] = [
    {
      icon: BarChart2,
      label: t('app.labSummary.stats.totalSessions'),
      value: String(totalSessions)
    },
    {
      icon: Trophy,
      label: t('app.labSummary.stats.completed'),
      value: String(completedSessions)
    },
    {
      icon: TrendingUp,
      label: t('app.labSummary.stats.avgPnl'),
      value: `${avgPnlPercent > 0 ? '+' : ''}${avgPnlPercent.toFixed(2)}%`,
      valueClass: pnlColor(avgPnlPercent)
    },
    {
      icon: Target,
      label: t('app.labSummary.stats.bestPnl'),
      value: `${bestPnlPercent > 0 ? '+' : ''}${bestPnlPercent.toFixed(2)}%`,
      valueClass: pnlColor(bestPnlPercent)
    },
    {
      icon: TrendingDown,
      label: t('app.labSummary.stats.avgDrawdown'),
      value: `${avgMaxDrawdown.toFixed(2)}%`
    },
    {
      icon: Clock,
      label: t('app.labSummary.stats.lastSession'),
      value: lastAt
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-6"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-blue-500" />
          <h2 className="font-bold">{t('app.labSummary.title')}</h2>
        </div>
        <Link
          to={tenantPath(slug, '/app/lab/history')}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t('app.labSummary.viewHistory')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid 2x3 de mini-stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <MiniStat key={s.label} {...s} />
        ))}
      </div>

      {/* Win rate bar */}
      {completedSessions > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t('app.labSummary.stats.avgWinRate')}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${Math.min(avgWinRate, 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-emerald-400">
            {avgWinRate.toFixed(1)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
