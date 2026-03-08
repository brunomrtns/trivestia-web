import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal } from '@/components/ui/Portal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnnouncementAdminItem } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────────────────
type FormValues = {
  title: string;
  body: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
  expiresAt?: string;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AnnouncementFormModalProps {
  open: boolean;
  initial?: AnnouncementAdminItem | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  isPending: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnnouncementFormModal({
  open,
  initial,
  onClose,
  onSubmit,
  isPending
}: AnnouncementFormModalProps) {
  const { t } = useTranslation();

  const schema = z.object({
    title: z
      .string()
      .min(3, t('admin.announcements.form.validation.titleMin'))
      .max(200, t('admin.announcements.form.validation.titleMax')),
    body: z
      .string()
      .min(1, t('common.validation.required'))
      .max(5000, t('admin.announcements.form.validation.bodyMax')),
    priority: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    expiresAt: z.string().optional()
  });

  const {
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'INFO' }
  });

  // Preenche formulário ao editar
  useEffect(() => {
    if (initial) {
      reset({
        title: initial.title,
        body: initial.body,
        priority: initial.priority,
        expiresAt: initial.expiresAt
          ? new Date(initial.expiresAt).toISOString().slice(0, 16)
          : ''
      });
    } else {
      reset({ title: '', body: '', priority: 'INFO', expiresAt: '' });
    }
  }, [initial, reset, open]);

  if (!open) return null;

  const isEdit = !!initial;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold text-lg">
              {isEdit
                ? t('admin.announcements.form.editTitle')
                : t('admin.announcements.form.newTitle')}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
            {/* Título */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('admin.announcements.form.titleLabel')}
              </label>
              <input
                {...register('title')}
                className={cn(
                  'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:ring-2 focus:ring-primary/40',
                  errors.title && 'border-destructive'
                )}
                placeholder={t('admin.announcements.form.titlePlaceholder')}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Prioridade */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('admin.announcements.form.priorityLabel')}
              </label>
              <select
                {...register('priority')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="INFO">{t('common.priority.info')}</option>
                <option value="WARNING">{t('common.priority.warning')}</option>
                <option value="CRITICAL">
                  {t('common.priority.critical')}
                </option>
              </select>
            </div>

            {/* Corpo */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('admin.announcements.form.bodyLabel')}
              </label>
              <textarea
                {...register('body')}
                rows={5}
                className={cn(
                  'w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/40',
                  errors.body && 'border-destructive'
                )}
                placeholder={t('admin.announcements.form.bodyPlaceholder')}
              />
              {errors.body && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.body.message}
                </p>
              )}
            </div>

            {/* Expira em */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('admin.announcements.form.expiresLabel')}{' '}
                <span className="text-muted-foreground font-normal">
                  {t('common.misc.optional')}
                </span>
              </label>
              <input
                type="datetime-local"
                {...register('expiresAt')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                {t('common.actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isPending
                  ? t('common.actions.saving')
                  : isEdit
                    ? t('common.actions.saveChanges')
                    : t('admin.announcements.form.publishButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
