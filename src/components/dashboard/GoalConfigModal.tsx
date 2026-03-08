import { useState } from 'react';
import { Portal } from '@/components/ui/Portal';
import { X, Target } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardEndpoints } from '@/services/endpoints/dashboard.endpoints';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoalConfigModalProps {
  open: boolean;
  currentTarget: number;
  slug: string;
  onClose: () => void;
}

// ─── Presets ─────────────────────────────────────────────────────────────────

const PRESETS = [1, 3, 5, 7, 10, 14, 20];

// ─── Component ────────────────────────────────────────────────────────────────

export function GoalConfigModal({
  open,
  currentTarget,
  slug,
  onClose
}: GoalConfigModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(currentTarget);

  const mutation = useMutation({
    mutationFn: (weeklyTarget: number) =>
      dashboardEndpoints.updateGoal(slug, { weeklyTarget }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-goals', slug] });
      toast.success(t('app.weeklyGoal.modal.toast.success', { weeklyTarget: data.weeklyTarget }));
      onClose();
    },
    onError: () => toast.error(t('app.weeklyGoal.modal.toast.error'))
  });

  if (!open) return null;

  const handleSave = () => {
    if (value === currentTarget) { onClose(); return; }
    mutation.mutate(value);
  };

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t('app.weeklyGoal.modal.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          <p className="text-sm text-muted-foreground">
            {t('app.weeklyGoal.modal.question')}
          </p>

          {/* Preset pills */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setValue(preset)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                  value === preset
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-accent'
                )}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('app.weeklyGoal.modal.customLabel')}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={value}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n)) setValue(Math.min(20, Math.max(1, n)));
              }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('app.weeklyGoal.modal.rangeHint')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t('common.actions.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? t('common.actions.saving') : t('app.weeklyGoal.modal.saveButton')}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
