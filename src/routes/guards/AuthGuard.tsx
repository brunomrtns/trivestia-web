import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { WrongTenantGate } from '@/components/WrongTenantGate';

export function AuthGuard() {
  const { isAuthenticated, isLoading, tenantSlug: storeSlug, user } = useAuthStore();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const location = useLocation();

  if (isLoading) return null; // Aguarda hidratação do store

  const loginPath = tenantSlug ? `/t/${tenantSlug}/login` : '/login';

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${loginPath}?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Bloqueia acesso cross-tenant: slug da URL deve bater com o slug do token
  if (tenantSlug && tenantSlug !== storeSlug && user?.role !== 'SUPER_ADMIN') {
    return <WrongTenantGate correctSlug={storeSlug!} />;
  }

  return <Outlet />;
}
