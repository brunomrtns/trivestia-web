import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiTenant } from '@/services/api/apiTenant';
import type { TenantPublicProfile } from '@/types/api';
import { useEffect } from 'react';
import { authStorage } from '@/features/auth/storage';
import { useAuthStore } from '@/features/auth/auth.store';

/**
 * Hook que le :tenantSlug dos params e carrega o perfil publico do tenant.
 * Aplica CSS custom properties do themeJson no :root.
 * Salva lastTenantSlug no storage.
 */
export function useTenant() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const query = useQuery({
    queryKey: ['tenant', tenantSlug],
    queryFn: () =>
      apiTenant(tenantSlug!)
        .get<TenantPublicProfile>('/tenant')
        .then((r) => r.data),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1
  });

  // Aplicar CSS vars do tema
  useEffect(() => {
    const theme = query.data?.themeJson;
    if (!theme) return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme)) {
      root.style.setProperty(`--${key}`, value);
    }
    return () => {
      for (const key of Object.keys(theme)) {
        root.style.removeProperty(`--${key}`);
      }
    };
  }, [query.data?.themeJson]);

  // Salvar ultimo slug — mas NÃO sobrescrever quando o user está logado em outro tenant
  const { isAuthenticated, tenantSlug: authTenantSlug } = useAuthStore();
  useEffect(() => {
    if (tenantSlug) {
      // Só persiste se: não está autenticado, ou o tenant da URL é o mesmo do login
      if (!isAuthenticated || authTenantSlug === tenantSlug) {
        authStorage.setLastTenantSlug(tenantSlug);
      }
    }
  }, [tenantSlug, isAuthenticated, authTenantSlug]);

  return {
    slug: tenantSlug ?? '',
    tenant: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError
  };
}
