import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, CheckCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { announcementsEndpoints } from '@/services/endpoints/announcements.endpoints';
import { cn } from '@/lib/utils';
import type { AnnouncementPriority } from '@/types/api';

// ─── Priority helpers ─────────────────────────────────────────────────────────

const priorityColors: Record<
  AnnouncementPriority,
  { badge: string; border: string }
> = {
  INFO: { badge: 'bg-blue-500/10 text-blue-600', border: 'border-l-blue-500' },
  WARNING: {
    badge: 'bg-yellow-500/10 text-yellow-600',
    border: 'border-l-yellow-500'
  },
  CRITICAL: { badge: 'bg-red-500/10 text-red-600', border: 'border-l-red-500' }
};

const priorityLabel: Record<AnnouncementPriority, string> = {
  INFO: 'Informação',
  WARNING: 'Atenção',
  CRITICAL: 'Urgente'
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function AnnouncementsPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', slug, page],
    queryFn: () => announcementsEndpoints.list(slug, page, PAGE_SIZE)
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['announcements-unread', slug] });
    queryClient.invalidateQueries({ queryKey: ['announcements', slug, page] });
    queryClient.invalidateQueries({ queryKey: ['announcements-preview', slug] });
  };

  const markReadMutation = useMutation({
    mutationFn: (announcementId: string) =>
      announcementsEndpoints.markRead(slug, announcementId),
    onSuccess: () => invalidate()
  });

  const markAllMutation = useMutation({
    mutationFn: () => announcementsEndpoints.markAllRead(slug),
    onSuccess: (res) => {
      invalidate();
      toast.success(`${res.marked} aviso(s) marcado(s) como lido(s).`);
    }
  });

  const totalPages = data ? Math.ceil(data.pagination.total / PAGE_SIZE) : 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Avisos</h1>
          {(data?.unreadCount ?? 0) > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {data!.unreadCount} não {data!.unreadCount === 1 ? 'lido' : 'lidos'}
            </span>
          )}
        </div>
        {(data?.unreadCount ?? 0) > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todos como lidos
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-24 rounded-xl border bg-muted" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-12 text-center text-muted-foreground">
          <Megaphone className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>Nenhum aviso disponível no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((ann) => {
            const colors = priorityColors[ann.priority];
            return (
              <div
                key={ann.id}
                className={cn(
                  'rounded-xl border border-l-4 bg-card p-4 shadow-sm transition-opacity',
                  colors.border,
                  ann.isRead && 'opacity-70'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-bold uppercase',
                          colors.badge
                        )}
                      >
                        {priorityLabel[ann.priority]}
                      </span>
                      {!ann.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <h3 className="font-semibold">{ann.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {ann.body}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {ann.author.name} · {formatDate(ann.publishedAt)}
                      {ann.expiresAt && (
                        <span> · expira em {formatDate(ann.expiresAt)}</span>
                      )}
                    </p>
                  </div>

                  {!ann.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate(ann.id)}
                      disabled={markReadMutation.isPending}
                      title="Marcar como lido"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md px-3 py-1.5 text-sm border transition-colors hover:bg-accent disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md px-3 py-1.5 text-sm border transition-colors hover:bg-accent disabled:opacity-40"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
}
