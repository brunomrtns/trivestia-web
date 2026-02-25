import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/auth.store';

export function SuperAdminGuard() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated) {
    // SUPER_ADMIN faz login via tenant normal, mas acessa /super/*
    // Redireciona para landing com returnTo
    return (
      <Navigate
        to={`/?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (user?.role !== 'SUPER_ADMIN') {
    toast.error('Acesso restrito ao Super Admin da plataforma.');
    // Redireciona para o último tenant conhecido ou landing
    const slug = localStorage.getItem('@tm:lastTenantSlug');
    return <Navigate to={slug ? `/t/${slug}/app/dashboard` : '/'} replace />;
  }

  return <Outlet />;
}
