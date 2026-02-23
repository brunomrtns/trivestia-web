import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/auth.store';

export function AdminGuard() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (user?.role !== 'ADMIN') {
    toast.error('Acesso restrito a administradores.');
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
