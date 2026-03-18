import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal } from '@/components/ui/Portal';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Loader2, CalendarRange } from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import type { PeriodDTO } from '@/types/api';

// ─── Types ──────────────────────────────────────────────────────

type FormData = {
  title: string;
  startDate: string;
  endDate: string;
  moduleIds: string[];
};

interface Props {
  slug: string;
  courseId: string;
  initial?: PeriodDTO;
  onClose: () => void;
  onSaved: () => void;
}

export default function PeriodFormModal({
  slug,
  courseId,
  initial,
  onClose,
  onSaved
}: Props) {
  const { t } = useTranslation();

  const schema = z
    .object({
      title: z.string().min(3, t('admin.periodForm.validation.title')),
      startDate: z.string().min(1, t('admin.periodForm.validation.date')),
      endDate: z.string().min(1, t('admin.periodForm.validation.date')),
      moduleIds: z
        .array(z.string())
        .min(1, t('admin.periodForm.validation.modules'))
    })
    .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
      message: t('admin.periodForm.validation.dateRange'),
      path: ['endDate']
    });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? '',
      startDate: initial?.startDate
        ? new Date(initial.startDate).toISOString().slice(0, 16)
        : '',
      endDate: initial?.endDate
        ? new Date(initial.endDate).toISOString().slice(0, 16)
        : '',
      moduleIds: initial?.modules.map((pm) => pm.moduleId) ?? []
    }
  });

  const { data: modules, isLoading: loadingMods } = useQuery({
    queryKey: ['modules', slug, courseId],
    queryFn: () => learningEndpoints.getModules(slug, courseId)
  });

  const createMut = useMutation({
    mutationFn: (data: FormData) =>
      adminEndpoints.createPeriod(slug, courseId, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString()
      }),
    onSuccess: () => {
      toast.success(t('admin.periodForm.toast.created'));
      onSaved();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(
        e?.response?.data?.message ?? t('admin.periodForm.toast.createError')
      )
  });

  const updateMut = useMutation({
    mutationFn: (data: FormData) =>
      adminEndpoints.updatePeriod(slug, courseId, initial!.id, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString()
      }),
    onSuccess: () => {
      toast.success(t('admin.periodForm.toast.updated'));
      onSaved();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(
        e?.response?.data?.message ?? t('admin.periodForm.toast.updateError')
      )
  });

  const isPending = createMut.isPending || updateMut.isPending;

  const onSubmit = (data: FormData) => {
    if (initial) updateMut.mutate(data);
    else createMut.mutate(data);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
        <div className="my-4 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2.5">
              <CalendarRange className="h-5 w-5 text-primary" />
              <span className="font-semibold">
                {initial
                  ? t('admin.periodForm.editTitle')
                  : t('admin.periodForm.createTitle')}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('admin.periodForm.title')}
              </label>
              <input
                placeholder={t('admin.periodForm.titlePlaceholder')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                {...register('title')}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('admin.periodForm.startDate')}
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('admin.periodForm.endDate')}
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Modules */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('admin.periodForm.modulesLabel')}
              </label>
              {loadingMods ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />{' '}
                  {t('admin.periodForm.loadingModules')}
                </div>
              ) : (
                <Controller
                  control={control}
                  name="moduleIds"
                  render={({ field }) => (
                    <div className="max-h-52 overflow-y-auto rounded-lg border bg-background p-2 space-y-1">
                      {modules?.length === 0 && (
                        <p className="p-2 text-xs text-muted-foreground">
                          {t('admin.periodForm.noModules')}
                        </p>
                      )}
                      {modules?.map((mod) => {
                        const checked = field.value.includes(mod.id);
                        return (
                          <label
                            key={mod.id}
                            className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 text-sm hover:bg-accent"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, mod.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter((id) => id !== mod.id)
                                  );
                                }
                              }}
                            />
                            <span>{mod.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              )}
              {errors.moduleIds && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.moduleIds.message}
                </p>
              )}
            </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t px-5 py-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {initial
                  ? t('common.actions.saveChanges')
                  : t('admin.periodForm.toast.createPeriod')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
              >
                {t('common.actions.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
