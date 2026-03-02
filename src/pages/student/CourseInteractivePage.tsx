import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, GraduationCap, Menu, X } from 'lucide-react';
import { courseInteractiveEndpoints } from '@/services/endpoints/course-interactive.endpoints';
import { CourseInteractiveHeader } from '@/components/learning/CourseInteractiveHeader';
import { CourseOutlineSidebar } from '@/components/learning/CourseOutlineSidebar';
import { CourseInlineLessonPlayer } from '@/components/learning/CourseInlineLessonPlayer';

export default function CourseInteractivePage() {
  const { courseId, tenantSlug } = useParams<{
    courseId: string;
    tenantSlug: string;
  }>();
  const slug = tenantSlug ?? '';
  const queryClient = useQueryClient();

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [initialStepId, setInitialStepId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Query ────────────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['course-interactive', slug, courseId],
    queryFn: () =>
      courseInteractiveEndpoints.getCourseInteractive(slug, courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const selectLesson = useCallback(
    (lessonId: string, moduleId: string, stepId?: string) => {
      setActiveLessonId(lessonId);
      setActiveModuleId(moduleId);
      setInitialStepId(stepId);
      setSidebarOpen(false);
    },
    []
  );

  const handleContinue = useCallback(() => {
    if (!data) return;

    if (data.next) {
      selectLesson(data.next.lessonId, data.next.moduleId, data.next.stepId);
    } else if (data.modules.length > 0) {
      // Course complete — review first lesson
      const firstMod = data.modules[0];
      const firstLesson = firstMod.lessons[0];
      if (firstLesson) {
        selectLesson(firstLesson.id, firstMod.id);
      }
    }
  }, [data, selectLesson]);

  const handleLessonComplete = useCallback(() => {
    // Refresh interactive data to get updated next
    queryClient.invalidateQueries({
      queryKey: ['course-interactive', slug, courseId]
    });

    // Find the next lesson after the current one
    if (!data || !activeLessonId) return;

    let foundCurrent = false;
    for (const mod of data.modules) {
      for (const lesson of mod.lessons) {
        if (foundCurrent) {
          selectLesson(lesson.id, mod.id);
          return;
        }
        if (lesson.id === activeLessonId) {
          foundCurrent = true;
        }
      }
    }

    // No next lesson — deselect to show completion state
    setActiveLessonId(null);
  }, [data, activeLessonId, courseId, queryClient, selectLesson]);

  // Auto-select first lesson when data loads and nothing is selected
  useEffect(() => {
    if (!data || activeLessonId) return;

    // If there's a "next", select that module+lesson
    if (data.next) {
      setActiveModuleId(data.next.moduleId);
      // Don't auto-play; just set the module context
    }
  }, [data, activeLessonId]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <GraduationCap className="h-12 w-12 opacity-30" />
        <p>Curso não encontrado.</p>
        <Link
          to={`/t/${slug}/app/courses`}
          className="text-sm text-primary hover:underline"
        >
          Voltar aos cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 border-b bg-background px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <Link
            to={`/t/${slug}/app/courses/${courseId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Link>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <span className="flex-1 truncate text-sm font-medium lg:text-base">
            {data.course.title}
          </span>

          <span className="shrink-0 text-xs text-muted-foreground">
            {data.progress.percent}% concluído
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed inset-y-0 left-0 z-40 w-72 border-r bg-card pt-16 transition-transform
            lg:relative lg:inset-y-auto lg:left-auto lg:z-auto lg:w-72 lg:translate-x-0 lg:pt-0
          `}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3">
              <CourseOutlineSidebar
                slug={slug}
                modules={data.modules}
                activeLessonId={activeLessonId}
                onSelectLesson={selectLesson}
              />
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
            {/* Header with progress + continue */}
            {!activeLessonId && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <CourseInteractiveHeader
                  course={data.course}
                  progress={data.progress}
                  next={data.next}
                  onContinue={handleContinue}
                />

                {/* Quick overview of modules */}
                <div className="space-y-3">
                  {data.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{mod.title}</h3>
                        <span className="text-xs text-muted-foreground">
                          {mod.progress.completedLessons}/
                          {mod.progress.totalLessons} aulas
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${mod.progress.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inline lesson player */}
            {activeLessonId && (
              <motion.div
                key={activeLessonId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CourseInlineLessonPlayer
                  slug={slug}
                  lessonId={activeLessonId}
                  initialStepId={initialStepId}
                  onLessonComplete={handleLessonComplete}
                />
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
