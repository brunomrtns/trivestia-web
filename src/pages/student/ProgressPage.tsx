import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { progressEndpoints } from '@/services/endpoints/progress.endpoints';
import { getProgressColor, formatDate } from '@/lib/utils';
import type { ProgressStatus } from '@/types/api';
import { useTranslation } from 'react-i18next';

function StatusIcon({ status }: { status: ProgressStatus }) {
  if (status === 'COMPLETED')
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === 'IN_PROGRESS')
    return <Clock className="h-5 w-5 text-yellow-500" />;
  return <XCircle className="h-5 w-5 text-muted-foreground" />;
}

export default function ProgressPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';

  // GET /progress — Bearer ANY
  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress', slug],
    queryFn: () => progressEndpoints.getProgress(slug)
  });

  const completed = progress?.filter((p) => p.status === 'COMPLETED') ?? [];
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((acc, p) => acc + p.score, 0) / completed.length
        )
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">{t('app.progress.title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('app.progress.subtitle')}
        </p>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {t('app.progress.stats.completed')}
          </div>
          <p className="mt-2 text-3xl font-extrabold">{completed.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t('app.progress.stats.avgScore')}
          </div>
          <p className="mt-2 text-3xl font-extrabold">{avgScore}%</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            {t('app.progress.stats.totalLessons')}
          </div>
          <p className="mt-2 text-3xl font-extrabold">
            {progress?.length ?? 0}
          </p>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 rounded-xl bg-muted" />
          ))}
        </div>
      ) : progress?.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>{t('app.progress.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {progress?.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4"
            >
              <StatusIcon status={p.status} />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">
                  {p.lesson?.title ?? t('app.lesson.fallbackTitle')}
                </p>
                <p className={`text-xs ${getProgressColor(p.status)}`}>
                  {t(`common.progressStatus.${p.status}`, { defaultValue: p.status })}
                  {p.completedAt && ` · ${formatDate(p.completedAt)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{p.score}%</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
