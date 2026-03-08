import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarRange,
  ArrowLeft,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import type { PeriodDTO } from '@/types/api';
import PeriodFormModal from './PeriodFormModal';

function isActivePeriod(period: PeriodDTO) {
  const now = new Date();
  return new Date(period.startDate) <= now && new Date(period.endDate) >= now;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export default function AdminPeriodsPage() {
  const { t } = useTranslation();
  const { tenantSlug, courseId } = useParams<{
    tenantSlug: string;
    courseId: string;
  }>();
  const slug = tenantSlug ?? '';
  const cId = courseId ?? '';
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PeriodDTO | null>(null);

  const { data: periods, isLoading } = useQuery({
    queryKey: ['periods', slug, cId],
    queryFn: () => adminEndpoints.listPeriods(slug, cId)
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminEndpoints.deletePeriod(slug, cId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['periods', slug, cId] });
      toast.success(t('admin.periods.toast.deleted'));
    },
    onError: () => toast.error(t('admin.periods.toast.deleteError'))
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/t/${slug}/admin/courses`}
            className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('admin.periods.backButton')}
          </Link>
          <h1 className="text-3xl font-extrabold">
            {t('admin.periods.title')}
          </h1>
          <p className="text-muted-foreground">{t('admin.periods.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t('admin.periods.newButton')}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {periods?.map((period, i) => {
            const active = isActivePeriod(period);
            return (
              <motion.div
                key={period.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-emerald-500/15' : 'bg-muted'}`}
                >
                  {active ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock className="h-4.5 w-4.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{period.title}</p>
                    {active && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {t('admin.periods.status.active')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(period.startDate)} —{' '}
                    {formatDate(period.endDate)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {period.modules.map((pm) => (
                      <span
                        key={pm.id}
                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {pm.module.title}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditing(period)}
                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    aria-label={t('admin.periods.aria.edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${period.title}"?`))
                        deleteMut.mutate(period.id);
                    }}
                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t('admin.periods.aria.delete')}
                  >
                    {deleteMut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {periods?.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <CalendarRange className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p>{t('admin.periods.empty')}</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <PeriodFormModal
          slug={slug}
          courseId={cId}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['periods', slug, cId] });
            setShowCreate(false);
          }}
        />
      )}
      {editing && (
        <PeriodFormModal
          slug={slug}
          courseId={cId}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['periods', slug, cId] });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
