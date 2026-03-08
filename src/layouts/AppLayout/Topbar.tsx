import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnnouncementBell } from '@/components/announcements/AnnouncementBell';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTenant } from '@/hooks/useTenant';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant(); // usa cache do React Query — sem chamada extra
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (!tenantSlug) {
      navigate('/login');
      return;
    }
    // Passa o nome da escola para que a LoginPage mostre o badge imediatamente
    const schoolParam = tenant?.name
      ? `?school=${encodeURIComponent(tenant.name)}`
      : '';
    navigate(`/t/${tenantSlug}/login${schoolParam}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={t('common.aria.menu')}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        <AnnouncementBell />
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{user?.name ?? '...'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={t('common.aria.logout')})
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
