import { Menu, LogOut, User as UserIcon, Settings, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AnnouncementBell } from '@/components/announcements/AnnouncementBell';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { tenantPath } from '@/lib/tenant';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const slug = tenantSlug ?? '';

  const handleLogout = () => {
    logout();
    if (!tenantSlug) {
      navigate('/login');
      return;
    }
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

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-accent focus:outline-none">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.name ?? '...'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[220px] overflow-hidden rounded-xl border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              {/* Cabeçalho do menu com dados do usuário */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                {user?.email && (
                  <p className="mt-1 text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              {/* Opções de conta */}
              <DropdownMenu.Item asChild>
                <Link
                  to={tenantPath(slug, '/app/settings')}
                  className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  {t('common.nav.settings')}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Item
                onSelect={handleLogout}
                className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                {t('common.aria.logout')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
