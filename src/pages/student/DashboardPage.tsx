import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  BarChart3,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { progressEndpoints } from '@/services/endpoints/progress.endpoints';
import { dashboardEndpoints } from '@/services/endpoints/dashboard.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { getProgressColor } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { tenantPath } from '@/lib/tenant';
import {
  ContinueCard,
  ContinueCardSkeleton
} from '@/components/dashboard/ContinueCard';
import {
  LabSummaryCard,
  LabSummaryCardSkeleton
} from '@/components/dashboard/LabSummaryCard';
import {
  WeeklyGoalWidget,
  WeeklyGoalWidgetSkeleton
} from '@/components/dashboard/WeeklyGoalWidget';

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';

  // GET /courses — público
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', slug],
    queryFn: () => learningEndpoints.getCourses(slug)
  });

  // GET /progress — Bearer ANY
  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['progress', slug],
    queryFn: () => progressEndpoints.getProgress(slug)
  });

  // GET /dashboard/continue
  const { data: continueData, isLoading: loadingContinue } = useQuery({
    queryKey: ['dashboard-continue', slug],
    queryFn: () => dashboardEndpoints.getContinue(slug),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: true
  });

  // GET /dashboard/lab-summary
  const { data: labSummary, isLoading: loadingLabSummary } = useQuery({
    queryKey: ['dashboard-lab-summary', slug],
    queryFn: () => dashboardEndpoints.getLabSummary(slug),
    staleTime: 5 * 60_000
  });

  // GET /dashboard/goals
  const { data: goalsData, isLoading: loadingGoals } = useQuery({
    queryKey: ['dashboard-goals', slug],
    queryFn: () => dashboardEndpoints.getGoals(slug),
    staleTime: 5 * 60_000
  });

  const completed =
    progress?.filter((p) => p.status === 'COMPLETED').length ?? 0;
  const inProgress =
    progress?.filter((p) => p.status === 'IN_PROGRESS').length ?? 0;
  const totalLessons = progress?.length ?? 0;
  const avgScore =
    totalLessons > 0
      ? Math.round(
          (progress?.reduce((acc, p) => acc + p.score, 0) ?? 0) / totalLessons
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold">
          {t('app.dashboard.greeting', {
            firstName: user?.name?.split(' ')[0]
          })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t('app.dashboard.subtitle')}
        </p>
      </div>

      {/* Continue Card */}
      {loadingContinue ? (
        <ContinueCardSkeleton />
      ) : continueData ? (
        <ContinueCard
          data={continueData}
          slug={slug}
          hasAnyCompleted={completed > 0}
        />
      ) : null}

      {/* Weekly Goal + Streak */}
      {loadingGoals ? (
        <WeeklyGoalWidgetSkeleton />
      ) : goalsData ? (
        <WeeklyGoalWidget data={goalsData} slug={slug} />
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t('app.dashboard.stats.completedLessons'),
            value: completed,
            icon: CheckCircle2,
            color: 'text-green-500'
          },
          {
            label: t('app.dashboard.stats.inProgress'),
            value: inProgress,
            icon: Clock,
            color: 'text-yellow-500'
          },
          {
            label: t('app.dashboard.stats.totalLessons'),
            value: totalLessons,
            icon: BookOpen,
            color: 'text-primary'
          },
          {
            label: t('app.dashboard.stats.avgScore'),
            value: `${avgScore}%`,
            icon: BarChart3,
            color: 'text-blue-500'
          }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="mt-2 text-3xl font-extrabold">
              {loadingProgress ? (
                <span className="animate-pulse text-muted">...</span>
              ) : (
                stat.value
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Lab Summary */}
      {loadingLabSummary ? (
        <LabSummaryCardSkeleton />
      ) : labSummary ? (
        <LabSummaryCard data={labSummary} slug={slug} />
      ) : null}

      {/* Cursos */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {t('app.dashboard.availableCourses')}
          </h2>
          <Link
            to={tenantPath(slug, '/app/courses')}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t('common.actions.viewAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingCourses ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border bg-card p-5 h-32"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses?.map((course) => (
              <Link
                key={course.id}
                to={tenantPath(slug, `/app/courses/${course.id}`)}
                className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Progresso recente */}
      {progress && progress.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {t('app.dashboard.recentActivity')}
            </h2>
            <Link
              to={tenantPath(slug, '/app/progress')}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t('common.actions.seeAll')} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {progress.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {p.lesson?.title ?? t('app.lesson.fallbackTitle')}
                  </p>
                  <p className={`text-xs ${getProgressColor(p.status)}`}>
                    {t(`common.progressStatus.${p.status}`, { defaultValue: p.status })}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {p.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
