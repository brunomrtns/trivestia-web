import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import {
  useLearningData,
  useLearningNav
} from '@/features/learning/learning.context';
import { getBackTarget } from '@/features/learning/learning.utils';

export default function LearningHeader() {
  const location = useLocation();
  const params = useParams<{
    tenantSlug: string;
    courseId: string;
    lessonId?: string;
    stepId?: string;
    activityId?: string;
  }>();
  const { course, modules, progress } = useLearningData();
  const { toggleOutline, activeLessonId, isDesktopOutlineVisible } =
    useLearningNav();

  const slug = params.tenantSlug ?? '';
  const backTarget = getBackTarget(
    location.pathname,
    {
      courseId: params.courseId,
      lessonId: params.lessonId,
      stepId: params.stepId,
      activityId: params.activityId
    },
    slug
  );

  const percent = progress?.percent ?? 0;

  const activeModule = useMemo(() => {
    if (!activeLessonId) return null;
    for (const module of modules) {
      if (module.lessons.some((item) => item.id === activeLessonId)) {
        return module;
      }
    }
    return null;
  }, [activeLessonId, modules]);

  const activeLesson = useMemo(() => {
    if (!activeLessonId || !activeModule) return null;
    return (
      activeModule.lessons.find((item) => item.id === activeLessonId) ?? null
    );
  }, [activeLessonId, activeModule]);

  return (
    <header className="absolute inset-x-0 top-0 z-30 h-12 border-b border-border/50 bg-background/80 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-background/70 md:h-14">
      <div className="flex h-full items-center gap-2 px-2 md:gap-3 md:px-4">
        <Link
          to={backTarget.path}
          title={backTarget.label}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <div className="min-w-0 flex-1">
          <nav
            className="flex min-w-0 items-center text-sm"
            aria-label="Breadcrumb"
          >
            {course ? (
              <>
                <span className="truncate text-muted-foreground transition-colors hover:text-foreground">
                  {course.title}
                </span>

                {activeModule && (
                  <>
                    <ChevronRight className="mx-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    <span className="truncate text-muted-foreground transition-colors hover:text-foreground">
                      {activeModule.title}
                    </span>
                  </>
                )}

                {activeLesson && (
                  <>
                    <ChevronRight className="mx-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    <span className="truncate font-semibold text-foreground">
                      {activeLesson.title}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Learning</span>
            )}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center md:flex">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold tabular-nums text-primary">
            {percent}%
          </span>
        </div>

        <button
          onClick={toggleOutline}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
          title="Estrutura do curso"
          aria-label={
            isDesktopOutlineVisible ? 'Fechar estrutura' : 'Abrir estrutura'
          }
          type="button"
        >
          {isDesktopOutlineVisible ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={toggleOutline}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          title="Estrutura do curso"
          aria-label="Abrir estrutura"
          type="button"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
