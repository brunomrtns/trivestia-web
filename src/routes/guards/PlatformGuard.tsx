import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformAuthStore } from '@/features/platform/platform.store';

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export function PlatformGuard() {
  const { isAuthenticated, isLoading } = usePlatformAuthStore();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
