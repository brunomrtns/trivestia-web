import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import type { LessonStepDTO } from '@/types/api';
import { useLearningData, useLearningNav } from '@/features/learning/learning.context';
import { useLessonTimeline, useStepViewTracker } from '@/features/learning/learning.hooks';
import { toLearningStep } from '@/features/learning/learning.routes';
import {
  isLearningCourseCompleted,
  resolveStepIdResult
} from '@/features/learning/learning.utils';
import {
  ActivityStepCard,
  ImageStepContent,
  TextStepContent,
  VideoStepContent
} from './StepContentRenderers';

const EMPTY_STEPS: LessonStepDTO[] = [];

export default function StepView() {
  const params = useParams<{ tenantSlug: string; courseId: string; lessonId: string; stepId: string }>();
  const lessonId = params.lessonId ?? '';
  const stepIdFromUrl = params.stepId ?? '';
  const tenantSlug = params.tenantSlug ?? '';

  const { slug, courseId, next, progress } = useLearningData();
  const {
    selectLesson,
    selectStep,
    startActivity,
    goToCompletion,
    goToOverview,
    setActionBar,
    setShellMode
  } = useLearningNav();
  const timelineQuery = useLessonTimeline(slug, lessonId);
  const { markViewed } = useStepViewTracker({ slug, courseId, lessonId });
  const lastMarkedStepIdRef = useRef<string | null>(null);

  const steps = useMemo(
    () => timelineQuery.data?.steps ?? EMPTY_STEPS,
    [timelineQuery.data?.steps]
  );
  const resolution = useMemo(
    () => resolveStepIdResult(steps, stepIdFromUrl),
    [stepIdFromUrl, steps]
  );
  const resolvedStepId = resolution.stepId;

  const currentStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === resolvedStepId),
    [resolvedStepId, steps]
  );

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const previousStep = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;
  const nextStep =
    currentStepIndex >= 0 && currentStepIndex < steps.length - 1
      ? steps[currentStepIndex + 1]
      : null;

  const isCanonicalUrl = Boolean(resolvedStepId && resolvedStepId === stepIdFromUrl);
  const isCourseCompleted = isLearningCourseCompleted(progress, next);

  const navigateByCourseNext = useCallback((): boolean => {
    if (!next || !currentStep) return false;

    if (
      next.kind === 'STEP' &&
      next.lessonId === lessonId &&
      next.stepId === currentStep.id
    ) {
      return false;
    }

    if (next.kind === 'ACTIVITY' && next.stepId && next.activityId) {
      startActivity(next.lessonId, next.stepId, next.activityId);
      return true;
    }

    if (next.stepId) {
      selectStep(next.lessonId, next.stepId);
      return true;
    }

    selectLesson(next.lessonId);
    return true;
  }, [currentStep, lessonId, next, selectLesson, selectStep, startActivity]);

  const getStepActivityId = useCallback((step: LessonStepDTO | null) => {
    if (step?.type !== 'ACTIVITY') return null;
    return (step.content as Record<string, string>).activityId || null;
  }, []);

  const onNext = useCallback(() => {
    if (nextStep) {
      const activityId = getStepActivityId(nextStep);
      if (activityId) {
        startActivity(lessonId, nextStep.id, activityId);
        return;
      }
      selectStep(lessonId, nextStep.id);
      return;
    }

    if (navigateByCourseNext()) {
      return;
    }

    if (isCourseCompleted) {
      goToCompletion();
      return;
    }

    goToOverview();
  }, [
    nextStep,
    getStepActivityId,
    lessonId,
    startActivity,
    selectStep,
    navigateByCourseNext,
    isCourseCompleted,
    goToCompletion,
    goToOverview
  ]);

  useEffect(() => {
    setShellMode('default');
  }, [setShellMode]);

  useEffect(() => {
    if (!isCanonicalUrl) return;

    const activityId = getStepActivityId(currentStep);
    if (activityId) {
      startActivity(lessonId, currentStep!.id, activityId);
    }
  }, [currentStep, isCanonicalUrl, lessonId, startActivity, getStepActivityId]);

  useEffect(() => {
    const isActivity = currentStep?.type === 'ACTIVITY';
    if (!currentStep || !lessonId || !isCanonicalUrl || isActivity) {
      setActionBar(null);
      return;
    }

    const nextIsActivity = nextStep?.type === 'ACTIVITY';

    setActionBar({
      canGoBack: Boolean(previousStep),
      canGoForward: Boolean(nextStep) || Boolean(next) || isCourseCompleted,
      currentLabel: `Step ${currentStepIndex + 1} de ${steps.length}`,
      nextLabel: nextIsActivity
        ? 'Iniciar atividade'
        : nextStep
          ? 'Próximo'
          : next
            ? next.kind === 'ACTIVITY'
              ? 'Iniciar atividade'
              : 'Próxima aula'
            : isCourseCompleted
              ? 'Concluir curso'
              : 'Visão geral',
      onPrevious: previousStep
        ? () => {
            selectStep(lessonId, previousStep.id);
          }
        : undefined,
      onNext
    });

    return () => {
      setActionBar(null);
    };
  }, [
    currentStep,
    currentStepIndex,
    isCanonicalUrl,
    lessonId,
    next,
    nextStep,
    previousStep,
    selectStep,
    setActionBar,
    steps.length,
    onNext,
    isCourseCompleted
  ]);

  useEffect(() => {
    if (!currentStep) return;
    if (!isCanonicalUrl) return;
    if (lastMarkedStepIdRef.current === currentStep.id) return;

    lastMarkedStepIdRef.current = currentStep.id;
    markViewed({
      stepId: currentStep.id,
      isViewed: currentStep.isViewed,
      isVirtual: currentStep.isVirtual
    });
  }, [currentStep, isCanonicalUrl, markViewed]);

  if (!tenantSlug || !params.courseId || !lessonId) {
    return null;
  }

  if (timelineQuery.isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (timelineQuery.error || !timelineQuery.data) {
    return (
      <StateMessage>
        Não foi possível carregar os steps da aula.
      </StateMessage>
    );
  }

  if (!steps.length) {
    return (
      <StateMessage>
        Esta aula ainda não possui steps.
      </StateMessage>
    );
  }

  if (!resolvedStepId) {
    return (
      <StateMessage>
        Não foi possível resolver um step válido.
      </StateMessage>
    );
  }

  if (resolvedStepId !== stepIdFromUrl) {
    return (
      <Navigate
        replace
        to={toLearningStep(tenantSlug, courseId, lessonId, resolvedStepId)}
      />
    );
  }

  if (!currentStep) {
    return (
      <StateMessage>
        Step não encontrado na timeline.
      </StateMessage>
    );
  }

  return (
    <article className="mx-auto max-w-[52rem]">
      {resolution.fallbackReason && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Step solicitado não foi encontrado na timeline. Fallback seguro aplicado.
        </div>
      )}
      <header className="mb-10 border-b border-border/40 pb-8">
        <p className="mb-2 text-sm font-medium tracking-wide text-muted-foreground">
          {timelineQuery.data.lesson.title}
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]">{currentStep.title}</h1>
      </header>

      <StepRenderer
        step={currentStep}
        onStartActivity={(activityId) => startActivity(lessonId, currentStep.id, activityId)}
      />
    </article>
  );
}

function StepRenderer({
  step,
  onStartActivity
}: {
  step: LessonStepDTO;
  onStartActivity: (activityId: string) => void;
}) {
  const content = step.content as Record<string, unknown>;

  if (step.type === 'CONTENT_TEXT') {
    return <TextStepContent content={content} />;
  }

  if (step.type === 'CONTENT_VIDEO') {
    return <VideoStepContent content={content} />;
  }

  if (step.type === 'CONTENT_IMAGE') {
    return <ImageStepContent content={content} />;
  }

  if (step.type === 'ACTIVITY') {
    return (
      <ActivityStepCard
        step={step}
        content={content}
        onStartActivity={onStartActivity}
      />
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      Tipo de step não suportado.
    </div>
  );
}

function StateMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
