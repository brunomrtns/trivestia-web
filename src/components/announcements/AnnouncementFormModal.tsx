import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnnouncementAdminItem } from '@/types/api';

// ─── Zod schema (client-side) ─────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  body: z.string().min(1, 'Obrigatório').max(5000, 'Máximo 5000 caracteres'),
  priority: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  expiresAt: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

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
  const {
    register,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold text-lg">
            {isEdit ? 'Editar Aviso' : 'Novo Aviso'}
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
            <label className="mb-1 block text-sm font-medium">Título *</label>
            <input
              {...register('title')}
              className={cn(
                'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:ring-2 focus:ring-primary/40',
                errors.title && 'border-destructive'
              )}
              placeholder="Título do aviso..."
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Prioridade */}
          <div>
            <label className="mb-1 block text-sm font-medium">Prioridade *</label>
            <select
              {...register('priority')}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="INFO">Informação</option>
              <option value="WARNING">Atenção</option>
              <option value="CRITICAL">Urgente</option>
            </select>
          </div>

          {/* Corpo */}
          <div>
            <label className="mb-1 block text-sm font-medium">Mensagem *</label>
            <textarea
              {...register('body')}
              rows={5}
              className={cn(
                'w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/40',
                errors.body && 'border-destructive'
              )}
              placeholder="Texto do aviso (suporta quebras de linha)..."
            />
            {errors.body && (
              <p className="mt-1 text-xs text-destructive">{errors.body.message}</p>
            )}
          </div>

          {/* Expira em */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Expira em{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Publicar aviso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
