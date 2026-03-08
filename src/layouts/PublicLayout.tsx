import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { authStorage } from '@/features/auth/storage';

export function PublicLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout, tenantSlug } = useAuthStore();
  const navigate = useNavigate();

  // Slug do último tenant visitado (fonte de verdade para links globais)
  const slug = tenantSlug ?? authStorage.getLastTenantSlug();

  const coursesHref = slug ? `/t/${slug}/courses` : '/courses';
  const dashboardHref = slug ? `/t/${slug}/app/dashboard` : '/app/dashboard';
  const loginHref = slug ? `/t/${slug}/login` : '/login';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>Trivestia</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to={coursesHref}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('common.nav.courses')}
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.name}
                </span>
                <Link
                  to={dashboardHref}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t('common.nav.dashboard')}
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
                to="/login"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t('common.actions.login')}
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        {t('public.footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
