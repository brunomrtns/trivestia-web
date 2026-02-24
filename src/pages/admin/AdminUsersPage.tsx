import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Shield,
  ShieldOff,
  User as UserIcon,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  Trophy
} from 'lucide-react';
import { adminUsersEndpoints } from '@/services/endpoints/admin.users.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { cn, formatDate } from '@/lib/utils';
import type {
  AdminUser,
  AdminUserDetail,
  Role,
  ListUsersParams
} from '@/types/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        role === 'ADMIN'
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {role === 'ADMIN' && <Shield className="h-3 w-3" />}
      {role}
    </span>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmRoleDialogProps {
  user: AdminUser;
  newRole: Role;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmRoleDialog({
  user,
  newRole,
  onConfirm,
  onCancel,
  isLoading
}: ConfirmRoleDialogProps) {
  const isPromotion = newRole === 'ADMIN';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">
          {isPromotion ? 'Promover a Administrador?' : 'Revogar Acesso Admin?'}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {isPromotion
            ? `"${user.name}" terá acesso total ao painel administrativo, incluindo gerenciamento de conteúdo e usuários.`
            : `"${user.name}" perderá o acesso administrativo e voltará a ser um estudante comum.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition',
              isPromotion
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-destructive hover:bg-destructive/90',
              'disabled:opacity-60'
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPromotion ? 'Sim, promover' : 'Sim, revogar'}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({
  userId,
  onClose
}: {
  userId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminUsersEndpoints.getUser(userId)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-lg rounded-2xl border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Detalhes do Usuário</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-5 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <UserIcon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold">{data.name}</p>
                <p className="text-sm text-muted-foreground">{data.email}</p>
                <div className="mt-1">
                  <RoleBadge role={data.role} />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs">Submissões</span>
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {data._count.submissions}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs">Aulas com progresso</span>
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {data._count.progress}
                </p>
              </div>
            </div>

            {/* Last activities */}
            {data.progress.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Atividade recente
                </p>
                <div className="space-y-2">
                  {data.progress.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="truncate text-foreground">
                        {p.lesson.title}
                      </span>
                      <span
                        className={cn(
                          'ml-2 shrink-0 text-xs font-medium',
                          p.status === 'COMPLETED'
                            ? 'text-green-600'
                            : p.status === 'IN_PROGRESS'
                              ? 'text-yellow-600'
                              : 'text-muted-foreground'
                        )}
                      >
                        {p.score.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
              <p>
                Cadastrado em:{' '}
                <span className="text-foreground">
                  {formatDate(data.createdAt)}
                </span>
              </p>
              {data.lastLoginAt && (
                <p>
                  Último login:{' '}
                  <span className="text-foreground">
                    {formatDate(data.lastLoginAt)}
                  </span>
                </p>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [params, setParams] = useState<ListUsersParams>({
    page: 1,
    pageSize: 20
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    user: AdminUser;
    newRole: Role;
  } | null>(null);

  // Debounce de busca
  const applySearch = useCallback(() => {
    setParams((p) => ({
      ...p,
      page: 1,
      search: search || undefined,
      role: (roleFilter as Role) || undefined
    }));
  }, [search, roleFilter]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminUsersEndpoints.listUsers(params),
    placeholderData: (prev) => prev
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      adminUsersEndpoints.updateRole(id, role),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-detail', updated.id] });
      toast.success(
        updated.role === 'ADMIN'
          ? `${updated.name} foi promovido a Administrador.`
          : `Role de ${updated.name} foi revertido para Estudante.`
      );
      setConfirmAction(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Erro ao atualizar role.');
      setConfirmAction(null);
    }
  });

  function handleRoleClick(user: AdminUser) {
    if (user.id === currentUser?.id) {
      toast.warning(
        'Você não pode alterar o próprio role. Peça a outro administrador.'
      );
      return;
    }
    const newRole: Role = user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    setConfirmAction({ user, newRole });
  }

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie roles e permissões dos usuários da plataforma.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as Role | '');
          }}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STUDENT">Estudante</option>
        </select>
        <button
          onClick={applySearch}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Buscar
        </button>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando usuários...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <UserIcon className="h-8 w-8 opacity-40" />
            <p className="text-sm">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Último login</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody
                className={cn(
                  'divide-y',
                  isFetching && 'opacity-60 transition-opacity'
                )}
              >
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailUserId(user.id)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
                        >
                          Detalhes
                        </button>
                        <button
                          onClick={() => handleRoleClick(user)}
                          disabled={user.id === currentUser?.id}
                          title={
                            user.id === currentUser?.id
                              ? 'Você não pode alterar o próprio role'
                              : undefined
                          }
                          className={cn(
                            'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
                            user.role === 'ADMIN'
                              ? 'border border-destructive/40 text-destructive hover:bg-destructive/10'
                              : 'border border-primary/40 text-primary hover:bg-primary/10'
                          )}
                        >
                          {user.role === 'ADMIN' ? (
                            <>
                              <ShieldOff className="h-3.5 w-3.5" /> Revogar
                              Admin
                            </>
                          ) : (
                            <>
                              <Shield className="h-3.5 w-3.5" /> Tornar Admin
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.total
              )}{' '}
              de {pagination.total} usuários
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
                }
                disabled={pagination.page <= 1}
                className="rounded-lg border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {detailUserId && (
          <UserDetailModal
            userId={detailUserId}
            onClose={() => setDetailUserId(null)}
          />
        )}
        {confirmAction && (
          <ConfirmRoleDialog
            user={confirmAction.user}
            newRole={confirmAction.newRole}
            isLoading={updateRoleMutation.isPending}
            onConfirm={() =>
              updateRoleMutation.mutate({
                id: confirmAction.user.id,
                role: confirmAction.newRole
              })
            }
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
