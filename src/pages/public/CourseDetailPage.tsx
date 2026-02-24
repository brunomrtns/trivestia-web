import { useParams, Link, useLocation } from 'react-router-dom';
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

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const base = location.pathname.startsWith('/app') ? '/app' : '';

  // GET /courses/:id — público
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningEndpoints.getCourse(courseId!),
    enabled: !!courseId
  });

  // GET /courses/:courseId/modules — público
  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => learningEndpoints.getModules(courseId!),
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
          Cursos
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{course?.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold">{course?.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {course?.description}
        </p>
        {!isAuthenticated && (
          <Link
            to={`/register`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90"
          >
            <PlayCircle className="h-5 w-5" />
            Começar curso
          </Link>
        )}
        {isAuthenticated && (
          <Link
            to={`/app/courses/${courseId}/interactive`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90"
          >
            <PlayCircle className="h-5 w-5" />
            Continuar curso
          </Link>
        )}
      </div>

      {/* Módulos */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Conteúdo do curso</h2>
        {modules?.map((mod, i) => (
          <ModuleAccordion
            key={mod.id}
            moduleId={mod.id}
            title={mod.title}
            index={i + 1}
            isAuthenticated={isAuthenticated}
            courseId={courseId!}
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
  courseId
}: {
  moduleId: string;
  title: string;
  index: number;
  isAuthenticated: boolean;
  courseId: string;
}) {
  // GET /modules/:moduleId/lessons — público
  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', moduleId],
    queryFn: () => learningEndpoints.getLessons(moduleId)
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
          {isLoading ? '...' : `${lessons?.length ?? 0} aulas`}
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
                  to={`/app/lessons/${lesson.id}`}
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
