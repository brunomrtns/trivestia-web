import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Portal } from '@/components/ui/Portal';
import { Search, Shield, Crown, Zap, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { superadminEndpoints } from '@/services/endpoints/superadmin.endpoints';
import type { SuperUser, Role } from '@/types/api';

const ROLE_LABELS: Record<
  Role,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'bg-purple-100 text-purple-700',
    icon: Zap
  },
  OWNER: { label: 'Owner', color: 'bg-amber-100 text-amber-700', icon: Crown },
  ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-700', icon: Shield },
  STUDENT: {
    label: 'Aluno',
    color: 'bg-gray-100 text-gray-700',
    icon: UserIcon
  }
};

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_LABELS[role];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── Role change modal ────────────────────────────────────────────────────────

function ChangeRoleModal({
  user,
  onClose
}: {
  user: SuperUser;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>(user.role);

  const mut = useMutation({
    mutationFn: () => superadminEndpoints.updateUserRole(user.id, role),
    onSuccess: () => {
      toast.success('Role atualizado com sucesso!');
      qc.invalidateQueries({ queryKey: ['super', 'users'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar role');
    }
  });

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl">
        <h3 className="mb-2 font-bold">Alterar Role</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {user.name} ({user.email})
          <br />
          Escola: <span className="font-mono">{user.tenant.slug}</span>
        </p>

        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
          <option value="STUDENT">Aluno</option>
        </select>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={role === user.role || mut.isPending}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {mut.isPending ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<SuperUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['super', 'users', { search, role: roleFilter, page }],
    queryFn: () =>
      superadminEndpoints.listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
        pageSize: 20
      })
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Usuários da Plataforma
        </h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários de todas as escolas.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-md border py-2 pl-10 pr-3 text-sm"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as Role | '');
            setPage(1);
          }}
        >
          <option value="">Todos os roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
          <option value="STUDENT">Aluno</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Escola</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((u: SuperUser) => (
                <tr
                  key={u.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">
                      {u.tenant.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="rounded-md border px-3 py-1 text-xs transition-colors hover:bg-accent"
                    >
                      Alterar Role
                    </button>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {data.pagination.total} usuário(s) • Página{' '}
                {data.pagination.page} de {data.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border px-3 py-1 text-xs disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                  className="rounded-md border px-3 py-1 text-xs disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {editingUser && (
        <ChangeRoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
