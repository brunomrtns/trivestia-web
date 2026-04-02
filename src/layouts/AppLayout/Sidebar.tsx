import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Crown,
  Users,
  TrendingUp,
  Zap,
  Globe,
  Megaphone,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth.store';
import { tenantPath } from '@/lib/tenant';

interface NavLink {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  alsoMatch?: string[];
}

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
}

function buildLinks(slug: string, t: (key: string) => string) {
  const studentLinks: NavLink[] = [
    {
      to: tenantPath(slug, '/app/dashboard'),
      icon: LayoutDashboard,
      label: t('common.nav.dashboard')
    },
    {
      to: tenantPath(slug, '/app/courses'),
      icon: GraduationCap,
      label: t('common.nav.courses'),
      alsoMatch: [tenantPath(slug, '/app/lessons')]
    },
    {
      to: tenantPath(slug, '/app/lab'),
      icon: TrendingUp,
      label: t('common.nav.lab'),
      alsoMatch: [tenantPath(slug, '/app/activity')]
    },
    {
      to: tenantPath(slug, '/app/progress'),
      icon: BarChart3,
      label: t('common.nav.progress')
    }
  ];

  const adminLinks: NavLink[] = [
    {
      to: tenantPath(slug, '/admin/courses'),
      icon: Settings,
      label: t('admin.nav.manageCourses')
    },
    {
      to: tenantPath(slug, '/admin/users'),
      icon: Users,
      label: t('admin.nav.users')
    },
    {
      to: tenantPath(slug, '/admin/announcements'),
      icon: Megaphone,
      label: t('common.nav.announcements')
    },
    {
      to: tenantPath(slug, '/admin/billing'),
      icon: Wallet,
      label: t('common.nav.billing')
    }
  ];

  return { studentLinks, adminLinks };
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';

  const { studentLinks, adminLinks } = buildLinks(slug, t);

  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'OWNER' ||
    user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const links = isAdmin ? [...studentLinks, ...adminLinks] : studentLinks;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link
          to={tenantPath(slug, '')}
          className="flex items-center gap-2 overflow-hidden"
        >
          <BookOpen className="h-6 w-6 shrink-0 text-primary" />
          {!collapsed && <span className="font-bold text-lg">Trivestia</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {links.map(({ to, icon: Icon, label, alsoMatch }) => {
          const active =
            location.pathname.startsWith(to) ||
            (alsoMatch?.some((prefix) =>
              location.pathname.startsWith(prefix)
            ) ??
              false);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {/* Link para Super Admin panel */}
        {isSuperAdmin && (
          <>
            <div className="my-2 border-t" />
            <Link
              to="/super/dashboard"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-purple-600 hover:bg-purple-50'
              )}
              title={collapsed ? t('admin.nav.platform') : undefined}
            >
              <Globe className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t('admin.nav.platform')}</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Role badge */}
      {!collapsed && user?.role === 'SUPER_ADMIN' && (
        <div className="m-2 flex items-center gap-2 rounded-lg bg-purple-500/10 p-3">
          <Zap className="h-4 w-4 text-purple-600" />
          <span className="text-xs font-medium text-purple-600">
            {t('common.roles.superAdmin')}
          </span>
        </div>
      )}
      {!collapsed && user?.role === 'OWNER' && (
        <div className="m-2 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3">
          <Crown className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-medium text-amber-600">
            {t('common.roles.owner')}
          </span>
        </div>
      )}
      {!collapsed && user?.role === 'ADMIN' && (
        <div className="m-2 flex items-center gap-2 rounded-lg bg-primary/10 p-3">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">
            {t('common.roles.admin')}
          </span>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={onCollapse}
        className="flex h-12 items-center justify-center border-t text-muted-foreground transition-colors hover:text-foreground"
        aria-label={
          collapsed
            ? t('common.aria.expandSidebar')
            : t('common.aria.collapseSidebar')
        }
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </aside>
  );
}
