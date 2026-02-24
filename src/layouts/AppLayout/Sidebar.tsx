import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/auth.store';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
}

const studentLinks = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/courses', icon: GraduationCap, label: 'Cursos' },
  { to: '/app/progress', icon: BarChart3, label: 'Progresso' }
];

const adminLinks = [
  { to: '/admin/courses', icon: Settings, label: 'Gerenciar Cursos' },
  { to: '/admin/users', icon: Users, label: 'Usuários' }
];

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const links =
    user?.role === 'ADMIN' ? [...studentLinks, ...adminLinks] : studentLinks;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <BookOpen className="h-6 w-6 shrink-0 text-primary" />
          {!collapsed && <span className="font-bold text-lg">Trivestia</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
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
      </nav>

      {/* Admin badge */}
      {!collapsed && user?.role === 'ADMIN' && (
        <div className="m-2 flex items-center gap-2 rounded-lg bg-primary/10 p-3">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">Admin</span>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={onCollapse}
        className="flex h-12 items-center justify-center border-t text-muted-foreground transition-colors hover:text-foreground"
        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
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
