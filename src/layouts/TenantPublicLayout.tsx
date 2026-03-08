import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTenant } from '@/hooks/useTenant';

/**
 * Layout público com header do tenant (/t/:tenantSlug/courses, etc.)
 */
export function TenantPublicLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const base = `/t/${tenantSlug}`;

  const handleLogout = () => {
    logout();
    const schoolParam = tenant?.name
      ? `?school=${encodeURIComponent(tenant.name)}`
      : '';
    navigate(`${base}/login${schoolParam}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to={base} className="flex items-center gap-2 font-bold text-xl">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt="" className="h-7 w-7 rounded" />
            ) : (
              <BookOpen className="h-6 w-6 text-primary" />
            )}
            <span>{tenant?.name ?? t('common.brandName')}</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to={`${base}/courses`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('workspace.tenantPublic.nav.courses')}
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.name}
                </span>
                <Link
                  to={`${base}/app/dashboard`}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t('workspace.tenantPublic.nav.dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t('common.aria.logout')}
                  title={t('common.aria.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to={`${base}/login`}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t('workspace.tenantPublic.nav.login')}
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {tenant?.name ?? t('common.brandName')}.{' '}
        {t('workspace.tenantPublic.footer')}
      </footer>
    </div>
  );
}
