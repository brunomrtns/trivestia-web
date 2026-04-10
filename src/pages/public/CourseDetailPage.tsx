import { useParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  BookOpen,
  FileText,
  Lock,
  PlayCircle
} from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { useAuthStore } from '@/features/auth/auth.store';
import { toLearningOverview, toLearningLesson } from '@/features/learning/learning.routes';

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

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const { courseId, tenantSlug } = useParams<{
    courseId: string;
    tenantSlug: string;
  }>();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const useLearningV2 = useAuthStore((s) => s.useLearningV2);
  const slug = tenantSlug ?? '';
  const base = location.pathname.includes('/app')
    ? `/t/${slug}/app`
    : `/t/${slug}`;

  // GET /courses/:id — público
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', slug, courseId],
    queryFn: () => learningEndpoints.getCourse(slug, courseId!),
    enabled: !!courseId
  });

  // GET /courses/:courseId/modules — público
  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ['modules', slug, courseId],
    queryFn: () => learningEndpoints.getModules(slug, courseId!),
    enabled: !!courseId
  });

  if (loadingCourse || loadingModules) {
    return (
      <div className="container py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded-lg bg-muted" />
          <div className="h-5 w-2/3 rounded-lg bg-muted" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to={`${base}/courses`} className="hover:text-foreground">
          {t('common.nav.courses')}
        </Link>
        <span className="text-foreground font-medium">{course?.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        {course?.thumbnailUrl ? (
          <div className="mb-5 overflow-hidden rounded-2xl border bg-muted">
            <img
              src={resolveCourseImageUrl(course.thumbnailUrl) ?? ''}
              alt={course.title}
              className="h-56 w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        )}
        <h1 className="text-4xl font-extrabold">{course?.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {course?.description}
        </p>
        {!isAuthenticated && (
          <Link
            to={`/t/${slug}/register`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90"
          >
            <PlayCircle className="h-5 w-5" />
            {t('public.courseDetail.startCourse')}
          </Link>
        )}
        {isAuthenticated && (
          <Link
            to={
              useLearningV2
                ? toLearningOverview(slug, courseId!)
                : `/t/${slug}/app/courses/${courseId}/interactive`
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90"
          >
            <PlayCircle className="h-5 w-5" />
            {t('public.courseDetail.continueCourse')}
          </Link>
        )}
      </div>

      {/* Módulos */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{t('public.courseDetail.contentTitle')}</h2>
        {modules?.map((mod, i) => (
          <ModuleAccordion
            key={mod.id}
            moduleId={mod.id}
            title={mod.title}
            index={i + 1}
            isAuthenticated={isAuthenticated}
            useLearningV2={useLearningV2}
            courseId={courseId!}
            slug={slug}
          />
        ))}
      </div>
    </div>
  );
}

function ModuleAccordion({
  moduleId,
  title,
  index,
  isAuthenticated,
  useLearningV2,
  courseId,
  slug
}: {
  moduleId: string;
  title: string;
  index: number;
  isAuthenticated: boolean;
  useLearningV2: boolean;
  courseId: string;
  slug: string;
}) {
  // GET /modules/:moduleId/lessons — público
  const { t } = useTranslation();
  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', slug, moduleId],
    queryFn: () => learningEndpoints.getLessons(slug, moduleId)
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border bg-card"
    >
      <div className="flex items-center gap-4 p-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {index}
        </span>
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {isLoading ? '...' : t('public.courseDetail.lessonCount', { n: lessons?.length ?? 0 })}
        </span>
      </div>

      {lessons && lessons.length > 0 && (
        <ul className="border-t divide-y">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center gap-3 px-5 py-3 text-sm"
            >
              {isAuthenticated ? (
                <Link
                  to={
                    useLearningV2
                      ? toLearningLesson(slug, courseId!, lesson.id)
                      : `/t/${slug}/app/lessons/${lesson.id}`
                  }
                  state={{ lessonTitle: lesson.title, courseId }}
                  className="flex w-full items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  {lesson.title}
                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                </Link>
              ) : (
                <span className="flex w-full items-center gap-3 text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  {lesson.title}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
