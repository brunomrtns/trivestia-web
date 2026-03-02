import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { announcementsEndpoints } from '@/services/endpoints/announcements.endpoints';
import { AnnouncementFormModal } from '@/components/announcements/AnnouncementFormModal';
import { cn } from '@/lib/utils';
import type { AnnouncementAdminItem, AnnouncementPriority } from '@/types/api';

// ─── Priority helpers ─────────────────────────────────────────────────────────

const priorityBadge: Record<AnnouncementPriority, string> = {
  INFO: 'bg-blue-500/10 text-blue-600',
  WARNING: 'bg-yellow-500/10 text-yellow-600',
  CRITICAL: 'bg-red-500/10 text-red-600'
};

const priorityLabel: Record<AnnouncementPriority, string> = {
  INFO: 'Info',
  WARNING: 'Atenção',
  CRITICAL: 'Urgente'
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAnnouncementsPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementAdminItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements-admin', slug, page],
    queryFn: () => announcementsEndpoints.listAdmin(slug, page, PAGE_SIZE)
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['announcements-admin', slug] });
    queryClient.invalidateQueries({ queryKey: ['announcements-unread', slug] });
    queryClient.invalidateQueries({ queryKey: ['announcements-preview', slug] });
  };

  const createMutation = useMutation({
    mutationFn: (values: Parameters<typeof announcementsEndpoints.create>[1]) =>
      announcementsEndpoints.create(slug, values),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      toast.success('Aviso publicado com sucesso!');
    },
    onError: () => toast.error('Erro ao publicar aviso.')
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      values
    }: {
      id: string;
      values: Parameters<typeof announcementsEndpoints.update>[2];
    }) => announcementsEndpoints.update(slug, id, values),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setEditing(null);
      toast.success('Aviso atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar aviso.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsEndpoints.remove(slug, id),
    onSuccess: () => {
      invalidate();
      setDeletingId(null);
      toast.success('Aviso removido.');
    },
    onError: () => toast.error('Erro ao remover aviso.')
  });

  const totalPages = data ? Math.ceil(data.pagination.total / PAGE_SIZE) : 1;

  const handleSubmit = (values: {
    title: string;
    body: string;
    priority: 'INFO' | 'WARNING' | 'CRITICAL';
    expiresAt?: string;
  }) => {
    const payload = {
      ...values,
      expiresAt: values.expiresAt
        ? new Date(values.expiresAt).toISOString()
        : undefined
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, values: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (ann: AnnouncementAdminItem) => {
    setEditing(ann);
    setModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Gerenciar Avisos</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo Aviso
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-14 rounded-xl border bg-muted" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-12 text-center text-muted-foreground">
          <Megaphone className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>Nenhum aviso publicado ainda.</p>
          <button
            onClick={openCreate}
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Criar primeiro aviso
          </button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Título</th>
                <th className="px-4 py-3 text-left font-medium">Prioridade</th>
                <th className="px-4 py-3 text-left font-medium">Autor</th>
                <th className="px-4 py-3 text-left font-medium">Publicado</th>
                <th className="px-4 py-3 text-left font-medium">Expira</th>
                <th className="px-4 py-3 text-center font-medium">Leituras</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.data.map((ann) => (
                <tr
                  key={ann.id}
                  className={cn('bg-card transition-colors hover:bg-muted/30', ann.isExpired && 'opacity-60')}
                >
                  <td className="px-4 py-3 font-medium max-w-xs truncate">
                    {ann.title}
                    {ann.isExpired && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase font-bold">
                        expirado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded px-2 py-0.5 text-xs font-bold uppercase', priorityBadge[ann.priority])}>
                      {priorityLabel[ann.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ann.author.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(ann.publishedAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ann.expiresAt ? formatDate(ann.expiresAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{ann.readCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(ann)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {deletingId === ann.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteMutation.mutate(ann.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-md px-2 py-1 text-xs bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-60"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="rounded-md px-2 py-1 text-xs border hover:bg-accent"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(ann.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Modal */}
      <AnnouncementFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
