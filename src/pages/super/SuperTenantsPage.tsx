import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Building2,
  ExternalLink,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';
import { superadminEndpoints } from '@/services/endpoints/superadmin.endpoints';
import type { SuperTenant, CreateTenantSuperData } from '@/types/api';

// ─── Create Tenant Modal ──────────────────────────────────────────────────────

function CreateTenantModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateTenantSuperData>({
    name: '',
    slug: '',
    bio: '',
    enabled: true
  });

  const createMut = useMutation({
    mutationFn: () => superadminEndpoints.createTenant(form),
    onSuccess: () => {
      toast.success('Escola criada com sucesso!');
      qc.invalidateQueries({ queryKey: ['super', 'tenants'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao criar escola');
    }
  });

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">Nova Escola</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugify(name) }));
              }}
              placeholder="Ex: Escola de Trading ABC"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="escola-abc"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Bio (opcional)
            </label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.bio ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={2}
              placeholder="Descrição breve da escola"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, enabled: e.target.checked }))
              }
            />
            <label htmlFor="enabled" className="text-sm">
              Habilitada
            </label>
          </div>

          <hr />
          <p className="text-xs text-muted-foreground">
            Owner (opcional) — se preenchido, cria o owner junto.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nome do Owner
              </label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.ownerName ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ownerName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Email do Owner
              </label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.ownerEmail ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ownerEmail: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Senha do Owner
            </label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.ownerPassword ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, ownerPassword: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            onClick={() => createMut.mutate()}
            disabled={!form.name || !form.slug || createMut.isPending}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {createMut.isPending ? 'Criando...' : 'Criar Escola'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperTenantsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'true' | 'false'>(
    'all'
  );
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['super', 'tenants', { search, enabled: enabledFilter, page }],
    queryFn: () =>
      superadminEndpoints.listTenants({
        search: search || undefined,
        enabled:
          enabledFilter !== 'all'
            ? (enabledFilter as 'true' | 'false')
            : undefined,
        page,
        pageSize: 20
      })
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      superadminEndpoints.updateTenant(id, { enabled }),
    onSuccess: () => {
      toast.success('Status atualizado');
      qc.invalidateQueries({ queryKey: ['super', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super', 'stats'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Escolas</h1>
          <p className="text-muted-foreground">
            Gerencie todos os tenants da plataforma.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" /> Nova Escola
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-md border py-2 pl-10 pr-3 text-sm"
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={enabledFilter}
          onChange={(e) => {
            setEnabledFilter(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="all">Todas</option>
          <option value="true">Ativas</option>
          <option value="false">Desativadas</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Escola</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium text-center">Usuários</th>
                <th className="px-4 py-3 font-medium text-center">Cursos</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((t: SuperTenant) => (
                <tr
                  key={t.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {t.slug}
                  </td>
                  <td className="px-4 py-3 text-center">{t._count.users}</td>
                  <td className="px-4 py-3 text-center">{t._count.courses}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        toggleMut.mutate({ id: t.id, enabled: !t.enabled })
                      }
                      className="inline-flex items-center gap-1 text-xs"
                      title={
                        t.enabled
                          ? 'Clique para desativar'
                          : 'Clique para ativar'
                      }
                    >
                      {t.enabled ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-green-600" />
                          <span className="text-green-600">Ativa</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-red-500" />
                          <span className="text-red-500">Desativada</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/super/tenants/${t.id}`)}
                        className="rounded-md border px-3 py-1 text-xs transition-colors hover:bg-accent"
                      >
                        Editar
                      </button>
                      <a
                        href={`/t/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border px-3 py-1 text-xs transition-colors hover:bg-accent"
                        title="Abrir escola"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nenhuma escola encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {data.pagination.total} escola(s) • Página{' '}
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

      {showCreate && <CreateTenantModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
