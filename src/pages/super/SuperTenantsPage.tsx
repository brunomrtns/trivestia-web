import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Portal } from '@/components/ui/Portal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      toast.success(t('super.tenants.toast.created'));
      qc.invalidateQueries({ queryKey: ['super', 'tenants'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || t('super.tenants.toast.createError')
      );
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
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-4 w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-bold">
            {t('super.tenants.modal.title')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('super.tenants.modal.nameLabel')}
              </label>
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
              <label className="mb-1 block text-sm font-medium">
                {t('super.tenants.modal.slugLabel')}
              </label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm font-mono"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="escola-abc"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('super.tenants.modal.bioLabel')}
              </label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.bio ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bio: e.target.value }))
                }
                rows={2}
                placeholder={t('super.tenants.modal.bioPlaceholder')}
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
                {t('super.tenants.modal.enabledLabel')}
              </label>
            </div>

            <hr />
            <p className="text-xs text-muted-foreground">
              {t('super.tenants.modal.ownerHint')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t('super.tenants.modal.ownerNameLabel')}
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
                  {t('super.tenants.modal.ownerEmailLabel')}
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
                {t('super.tenants.modal.ownerPasswordLabel')}
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
              {t('common.actions.cancel')}
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={!form.name || !form.slug || createMut.isPending}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {createMut.isPending
                ? t('super.tenants.modal.creating')
                : t('super.tenants.modal.createButton')}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperTenantsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();
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
      toast.success(t('super.tenants.toast.statusUpdated'));
      qc.invalidateQueries({ queryKey: ['super', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['super', 'stats'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('super.tenants.title')}
          </h1>
          <p className="text-muted-foreground">{t('super.tenants.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" /> {t('super.tenants.newButton')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-md border py-2 pl-10 pr-3 text-sm"
            placeholder={t('super.tenants.searchPlaceholder')}
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
          <option value="all">{t('super.tenants.filter.all')}</option>
          <option value="true">{t('super.tenants.filter.active')}</option>
          <option value="false">{t('super.tenants.filter.disabled')}</option>
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
                <th className="px-4 py-3 font-medium">
                  {t('super.tenants.table.school')}
                </th>
                <th className="px-4 py-3 font-medium">{t('super.tenants.table.slug')}</th>
                <th className="px-4 py-3 font-medium text-center">
                  {t('super.tenants.table.users')}
                </th>
                <th className="px-4 py-3 font-medium text-center">
                  {t('super.tenants.table.courses')}
                </th>
                <th className="px-4 py-3 font-medium text-center">
                  {t('super.tenants.table.status')}
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  {t('super.tenants.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((tenant: SuperTenant) => (
                <tr
                  key={tenant.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {tenant.slug}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tenant._count.users}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tenant._count.courses}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        toggleMut.mutate({
                          id: tenant.id,
                          enabled: !tenant.enabled
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs"
                      title={
                        tenant.enabled
                          ? t('super.tenants.status.clickToDisable')
                          : t('super.tenants.status.clickToEnable')
                      }
                    >
                      {tenant.enabled ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-green-600" />
                          <span className="text-green-600">
                            {t('super.tenants.status.active')}
                          </span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-red-500" />
                          <span className="text-red-500">
                            {t('super.tenants.status.disabled')}
                          </span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/super/tenants/${tenant.id}`)}
                        className="rounded-md border px-3 py-1 text-xs transition-colors hover:bg-accent"
                      >
                        {t('super.tenants.editButton')}
                      </button>
                      <a
                        href={`/t/${tenant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border px-3 py-1 text-xs transition-colors hover:bg-accent"
                        title={t('super.tenants.linkTitle')}
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
                    {t('super.tenants.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {t('super.tenants.pagination', {
                  total: data.pagination.total,
                  page: data.pagination.page,
                  totalPages: data.pagination.totalPages
                })}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border px-3 py-1 text-xs disabled:opacity-50"
                >
                  {t('common.pagination.previous')}
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                  className="rounded-md border px-3 py-1 text-xs disabled:opacity-50"
                >
                  {t('common.pagination.next')}
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
