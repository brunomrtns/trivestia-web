import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Layers } from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';

function resolveCourseImageUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;

  if (pathOrUrl.startsWith('/')) {
    return import.meta.env.DEV
      ? `http://localhost:3333/storage${pathOrUrl}`
      : `${window.location.origin}/trivestia/storage${pathOrUrl}`;
  }

  return pathOrUrl;
}

function CourseCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-card p-6">
      <div className="mb-4 h-36 w-full rounded-xl bg-muted" />
      <div className="mb-2 h-5 w-3/4 rounded-md bg-muted" />
      <div className="h-4 w-full rounded-md bg-muted" />
      <div className="mt-4 h-4 w-1/2 rounded-md bg-muted" />
    </div>
  );
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';

  // Quando montado dentro do AppLayout (/t/:slug/app/courses), os links mantêm o contexto autenticado
  const base = location.pathname.includes('/app')
    ? `/t/${slug}/app`
    : `/t/${slug}`;

  // GET /courses — público
  const {
    data: courses,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['courses', slug],
    queryFn: () => learningEndpoints.getCourses(slug)
  });

  return (
    <div className="container py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold">{t('public.courses.title')}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('public.courses.subtitle')}
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {t('public.courses.error')}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))
          : courses?.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`${base}/courses/${course.id}`}
                  className="group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                >
                  {course.thumbnailUrl ? (
                    <div className="mb-4 overflow-hidden rounded-xl border bg-muted">
                      <img
                        src={resolveCourseImageUrl(course.thumbnailUrl) ?? ''}
                        alt={course.title}
                        className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <h2 className="mb-2 text-lg font-bold group-hover:text-primary transition-colors">
                    {course.title}
                  </h2>
                  <p className="flex-1 text-sm text-muted-foreground line-clamp-3">
                    {course.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      {t('public.courses.card.modules', {
                        n: course.modules?.length ?? 0
                      })}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-primary">
                      {t('public.courses.card.viewCourse')}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}

        {!isLoading && !isError && courses?.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            {t('public.courses.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
