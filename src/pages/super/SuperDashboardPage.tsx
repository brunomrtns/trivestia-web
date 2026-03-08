import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Building2, Users, BookOpen, Activity } from 'lucide-react';
import { superadminEndpoints } from '@/services/endpoints/superadmin.endpoints';

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function SuperDashboardPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['super', 'stats'],
    queryFn: () => superadminEndpoints.stats()
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('super.dashboard.title')}
        </h1>
        <p className="text-muted-foreground">{t('super.dashboard.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border bg-muted"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Building2}
            label={t('super.dashboard.stats.totalTenants')}
            value={stats.tenants.total}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            icon={Activity}
            label={t('super.dashboard.stats.activeTenants')}
            value={stats.tenants.active}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={Users}
            label={t('super.dashboard.stats.users')}
            value={stats.users}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={BookOpen}
            label={t('super.dashboard.stats.courses')}
            value={stats.courses}
            color="bg-amber-100 text-amber-600"
          />
        </div>
      ) : null}
    </div>
  );
}
