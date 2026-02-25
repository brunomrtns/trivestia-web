import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { superadminEndpoints } from '@/services/endpoints/superadmin.endpoints';
import type { UpdateTenantSuperData } from '@/types/api';

export default function SuperTenantEditPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['super', 'tenants', tenantId],
    queryFn: () => superadminEndpoints.getTenant(tenantId!),
    enabled: !!tenantId
  });

  const [form, setForm] = useState<UpdateTenantSuperData>({});

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        slug: tenant.slug,
        bio: tenant.bio,
        logoUrl: tenant.logoUrl,
        enabled: tenant.enabled
      });
    }
  }, [tenant]);

  const updateMut = useMutation({
    mutationFn: () => superadminEndpoints.updateTenant(tenantId!, form),
    onSuccess: () => {
      toast.success('Escola atualizada com sucesso!');
      qc.invalidateQueries({ queryKey: ['super', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super', 'stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-muted-foreground">Tenant não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/super/tenants')}
          className="rounded-md border p-2 transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Escola</h1>
          <p className="text-muted-foreground">
            {tenant.name} —{' '}
            <span className="font-mono text-xs">{tenant.slug}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4 rounded-lg border bg-card p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.name ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              value={form.slug ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Bio</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.bio ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, bio: e.target.value || null }))
              }
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Logo URL</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.logoUrl ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, logoUrl: e.target.value || null }))
              }
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, enabled: e.target.checked }))
              }
            />
            <label htmlFor="enabled" className="text-sm font-medium">
              Escola habilitada
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => updateMut.mutate()}
              disabled={updateMut.isPending}
              className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMut.isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <a
              href={`/t/${tenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4" /> Acessar Escola
            </a>
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-medium">Estatísticas</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Usuários</dt>
                <dd className="font-medium">{tenant._count.users}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cursos</dt>
                <dd className="font-medium">{tenant._count.courses}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Criado em</dt>
                <dd className="font-medium">
                  {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            </dl>
          </div>

          {tenant.users.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-3 font-medium">Owners / Super Admins</h3>
              <ul className="space-y-2">
                {tenant.users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{u.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {u.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
