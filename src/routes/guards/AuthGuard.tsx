import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';

export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuthStore();
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

  return <Outlet />;
}
