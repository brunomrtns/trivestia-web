import { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useLearningData, useLearningNav } from '@/features/learning/learning.context';
import { useLessonTimeline } from '@/features/learning/learning.hooks';
import { toLearningStep } from '@/features/learning/learning.routes';
import { resolveStepIdResult } from '@/features/learning/learning.utils';

export default function LessonRedirect() {
  const params = useParams<{ tenantSlug: string; courseId: string; lessonId: string }>();
  const location = useLocation();
  const { slug, courseId, next } = useLearningData();
  const { setActionBar, setShellMode } = useLearningNav();
  const lessonId = params.lessonId ?? '';

  const timelineQuery = useLessonTimeline(slug, lessonId);

  useEffect(() => {
    setShellMode('default');
    setActionBar(null);
  }, [setActionBar, setShellMode]);

  if (!params.tenantSlug || !params.courseId || !lessonId) {
    return null;
  }

  if (timelineQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (timelineQuery.error || !timelineQuery.data) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Não foi possível carregar a timeline da aula.
      </div>
    );
  }

  const stepCandidates = timelineQuery.data.steps;
  const scopedNext = next && next.lessonId === lessonId ? next : null;
  const resolution = resolveStepIdResult(
    stepCandidates,
    scopedNext?.stepId,
    scopedNext
  );
  const targetStepId = resolution.stepId;

  if (!targetStepId) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Esta aula ainda não possui steps para navegação.
      </div>
    );
  }

  const targetPath = toLearningStep(params.tenantSlug, courseId, lessonId, targetStepId);
  if (location.pathname === targetPath) {
    return null;
  }

  return (
    <>
      {resolution.fallbackReason && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Step alvo indisponível. Aplicado fallback seguro para manter navegação.
        </div>
      )}
      <Navigate replace to={targetPath} />
    </>
  );
}
