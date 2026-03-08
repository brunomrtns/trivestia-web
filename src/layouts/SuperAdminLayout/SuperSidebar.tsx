import type React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLink {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

// (superLinks moved inside component to allow useTranslation)

interface SuperSidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
}

export function SuperSidebar({ collapsed, onCollapse }: SuperSidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const superLinks: NavLink[] = [
    {
      to: '/super/dashboard',
      icon: BarChart3,
      label: t('super.layout.nav.overview')
    },
    {
      to: '/super/tenants',
      icon: Building2,
      label: t('super.layout.nav.schools')
    },
    { to: '/super/users', icon: Users, label: t('super.layout.nav.users') }
  ];

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
          to="/super/dashboard"
          className="flex items-center gap-2 overflow-hidden"
        >
          <Globe className="h-6 w-6 shrink-0 text-purple-600" />
          {!collapsed && (
            <span className="font-bold text-lg">{t('super.layout.brand')}</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {superLinks.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-purple-600 text-white'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      {!collapsed && (
        <div className="m-2 flex items-center gap-2 rounded-lg bg-purple-500/10 p-3">
          <Zap className="h-4 w-4 text-purple-600" />
          <span className="text-xs font-medium text-purple-600">
            {t('super.layout.roleBadge')}
          </span>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={onCollapse}
        className="flex h-12 items-center justify-center border-t text-muted-foreground transition-colors hover:text-foreground"
        aria-label={
          collapsed
            ? t('super.layout.aria.expand')
            : t('super.layout.aria.collapse')
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
