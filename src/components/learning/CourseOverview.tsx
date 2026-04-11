import { useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Lock,
  PlayCircle
} from 'lucide-react';
import {
  useLearningData,
  useLearningNav
} from '@/features/learning/learning.context';
import { useBatchLessonUnlock } from '@/features/learning/learning.hooks';
import { isLearningCourseCompleted } from '@/features/learning/learning.utils';
import { ContinueLearningCard } from './ContinueLearningCard';

export default function CourseOverview() {
  const { slug, course, modules, progress, next } = useLearningData();
  const {
    selectLesson,
    selectStep,
    startActivity,
    goToCompletion,
    setActionBar,
    setShellMode
  } = useLearningNav();

  useEffect(() => {
    setShellMode('default');
    setActionBar(null);
  }, [setActionBar, setShellMode]);

  const allLessonIds = useMemo(
    () => modules.flatMap((m) => m.lessons.map((l) => l.id)),
    [modules]
  );

  const unlockMap = useBatchLessonUnlock(slug, allLessonIds);

  const currentLessonId = useMemo(() => {
    for (const module of modules) {
      const inProgress = module.lessons.find(
        (lesson) => lesson.progress.status === 'IN_PROGRESS'
      );
      if (inProgress) return inProgress.id;
    }

    return next?.lessonId ?? null;
  }, [modules, next?.lessonId]);

  const nextLessonId = next?.lessonId ?? null;
  const isCompleted = isLearningCourseCompleted(progress, next);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Visão geral do curso
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              {course?.title ?? 'Curso'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {course?.description ??
                'Acompanhe seu progresso e continue do ponto certo.'}
            </p>
          </div>

          <div className="min-w-44 rounded-xl border bg-background px-4 py-3 text-right">
            <p className="text-xs text-muted-foreground">Progresso do curso</p>
            <p className="mt-1 text-2xl font-extrabold">
              {progress?.percent ?? 0}%
            </p>
            <p className="text-xs text-muted-foreground">
              {progress?.completedLessons ?? 0}/{progress?.totalLessons ?? 0}{' '}
              aulas concluídas
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress?.percent ?? 0}%` }}
          />
        </div>

        {isCompleted && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <span className="font-medium text-emerald-900">
              Curso finalizado. Você pode revisar o conteúdo ou abrir a
              conclusão.
            </span>
            <button
              type="button"
              onClick={goToCompletion}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
            >
              Ver conclusão
            </button>
          </div>
        )}
      </header>

      <ContinueLearningCard />

      <div className="space-y-4">
        {modules.map((module) => (
          <article
            key={module.id}
            className="rounded-2xl border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">{module.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {module.progress.completedLessons}/
                  {module.progress.totalLessons} aulas concluídas
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">
                {module.progress.percent}%
              </span>
            </div>

            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${module.progress.percent}%` }}
              />
            </div>

            <div className="space-y-2">
              {module.lessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                const isNext = lesson.id === nextLessonId;
                const isDone = lesson.progress.status === 'COMPLETED';
                const isLocked = unlockMap.has(lesson.id)
                  ? !unlockMap.get(lesson.id)
                  : false;

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (isLocked) return;

                      if (next && next.lessonId === lesson.id) {
                        if (
                          next.kind === 'ACTIVITY' &&
                          next.stepId &&
                          next.activityId
                        ) {
                          startActivity(
                            lesson.id,
                            next.stepId,
                            next.activityId
                          );
                          return;
                        }

                        if (next.stepId) {
                          selectStep(lesson.id, next.stepId);
                          return;
                        }
                      }

                      selectLesson(lesson.id);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isLocked
                        ? 'border-border opacity-50 cursor-not-allowed'
                        : isCurrent
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border hover:border-primary/30 hover:bg-accent/40'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <PlayCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-muted-foreground" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {isLocked
                          ? 'Bloqueada'
                          : isCurrent
                            ? 'Aula atual'
                            : isNext
                              ? 'Próxima aula'
                              : isDone
                                ? 'Concluída'
                                : 'Não iniciada'}
                      </p>
                    </div>

                    <span className="text-xs font-medium text-muted-foreground">
                      {lesson.progress.percent}%
                    </span>
                  </button>
                );
              })}
            </div>
          </article>
        ))}

        {modules.length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            <BookOpen className="mx-auto mb-2 h-5 w-5" />
            Nenhum módulo foi publicado para este curso.
          </div>
        )}
      </div>
    </section>
  );
}
