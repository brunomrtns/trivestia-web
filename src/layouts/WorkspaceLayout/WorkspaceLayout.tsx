import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, LayoutDashboard, LogOut, School } from 'lucide-react';
import { usePlatformAuthStore } from '@/features/platform/platform.store';

export function WorkspaceLayout() {
  const { user, logout } = usePlatformAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link
            to="/workspace"
            className="flex items-center gap-2 font-bold text-xl"
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <span>Trivestia</span>
            <span className="ml-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Workspace
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to="/workspace"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('workspace.layout.nav.panel')}
            </Link>
            <Link
              to="/workspace/school"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <School className="h-4 w-4" />
              {t('workspace.layout.nav.school')}
            </Link>

            <div className="ml-2 flex items-center gap-3 border-l pl-4">
              <span className="text-sm text-muted-foreground">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={t('common.aria.logout')}
                title={t('common.aria.logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
