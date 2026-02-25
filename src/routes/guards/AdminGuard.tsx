import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/auth.store';
import { WrongTenantGate } from '@/components/WrongTenantGate';

export function AdminGuard() {
  const { isAuthenticated, isLoading, user, tenantSlug: storeSlug } = useAuthStore();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const location = useLocation();

  if (isLoading) return null;

  const loginPath = tenantSlug ? `/t/${tenantSlug}/login` : '/login';
  const dashboardPath = tenantSlug
    ? `/t/${tenantSlug}/app/dashboard`
    : '/app/dashboard';

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${loginPath}?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // OWNER herda ADMIN, SUPER_ADMIN tem acesso irrestrito
  if (
    user?.role !== 'ADMIN' &&
    user?.role !== 'OWNER' &&
    user?.role !== 'SUPER_ADMIN'
  ) {
    toast.error('Acesso restrito a administradores.');
    return <Navigate to={dashboardPath} replace />;
  }

  // Bloqueia acesso cross-tenant: slug da URL deve bater com o slug do token
  if (tenantSlug && tenantSlug !== storeSlug && user?.role !== 'SUPER_ADMIN') {
    return <WrongTenantGate correctSlug={storeSlug!} />;
  }

  return <Outlet />;
}
