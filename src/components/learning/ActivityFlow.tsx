import { useCallback, useEffect, useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { LessonStepDTO } from '@/types/api';
import {
  useLearningData,
  useLearningNav
} from '@/features/learning/learning.context';
import {
  useActivity,
  useActivitySubmission,
  useLessonTimeline,
  useLessonUnlock
} from '@/features/learning/learning.hooks';
import { toLearningActivity } from '@/features/learning/learning.routes';
import {
  buildLearningNextUrl,
  invalidateLearningCache,
  isLearningCourseCompleted
} from '@/features/learning/learning.utils';
import { ActivityQuestionCard } from './ActivityQuestionCard';
import { ActivityResult } from './ActivityResult';
import { ActivityEmptyState } from './ActivityEmptyState';
import { ActivityErrorState } from './ActivityErrorState';
import { SimTradingChallengeActivityFlow } from './SimTradingChallengeActivityFlow';
import {
  useActivityFlowIntegration,
  useActivitySession
} from './activity-flow.hooks';

const EMPTY_STEPS: LessonStepDTO[] = [];

export default function ActivityFlow() {
  const params = useParams<{
    tenantSlug: string;
    courseId: string;
    lessonId: string;
    stepId: string;
    activityId: string;
  }>();

  const lessonId = params.lessonId ?? '';
  const stepId = params.stepId ?? '';
  const activityId = params.activityId ?? '';
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
  const activityQuery = useActivity(slug, lessonId, activityId);
  const unlockQuery = useLessonUnlock(slug, lessonId);
  const submission = useActivitySubmission(slug, activityId);
  const queryClient = useQueryClient();

  const steps = useMemo(
    () => timelineQuery.data?.steps ?? EMPTY_STEPS,
    [timelineQuery.data?.steps]
  );

  const canonicalStep = useMemo(
    () =>
      steps.find(
        (candidate) =>
          candidate.type === 'ACTIVITY' &&
          extractActivityIdFromStep(candidate) === activityId
      ) ?? null,
    [activityId, steps]
  );

  const currentStepIndex = useMemo(
    () =>
      steps.findIndex(
        (candidate) => candidate.id === (canonicalStep?.id ?? stepId)
      ),
    [canonicalStep?.id, stepId, steps]
  );

  const nextStep =
    currentStepIndex >= 0 && currentStepIndex < steps.length - 1
      ? steps[currentStepIndex + 1]
      : null;

  const previousStep =
    currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;

  const activity = activityQuery.data ?? null;
  const questions = useMemo(
    () => activity?.questions ?? [],
    [activity?.questions]
  );
  const review = submission.reviewData;
  const isCourseExpired = unlockQuery.data?.reason === 'COURSE_EXPIRED';
  const isCourseCompleted = isLearningCourseCompleted(progress, next);
  const globalNextUrl = buildLearningNextUrl(slug, courseId, next);
  const nextStepLabel = nextStep
    ? 'Próximo step'
    : globalNextUrl
      ? next?.kind === 'ACTIVITY'
        ? 'Iniciar atividade'
        : 'Próxima aula'
      : isCourseCompleted
        ? 'Concluir curso'
        : 'Voltar para overview';

  const {
    currentIndex,
    currentQuestion,
    answers,
    localResult,
    isRetrying,
    hasResult: hasLocalResult,
    setAnswer,
    goPrevious,
    goNext,
    resetSession,
    setLocalResult
  } = useActivitySession({
    activityId,
    questions
  });

  const hasResult = !isRetrying && (hasLocalResult || Boolean(review));
  const shouldShowReviewLoader = submission.review.isLoading && !localResult;
  const isSimTrading = activity?.type === 'SIM_TRADING_CHALLENGE';

  const onExitToLesson = useCallback(() => {
    if (previousStep) {
      selectStep(lessonId, previousStep.id);
      return;
    }

    selectLesson(lessonId);
  }, [lessonId, previousStep, selectLesson, selectStep]);

  const onExitToLessonSafe = useCallback(() => {
    if (previousStep) {
      selectStep(lessonId, previousStep.id);
      return;
    }

    selectLesson(lessonId);
  }, [lessonId, previousStep, selectLesson, selectStep]);

  const onExitForward = useCallback(() => {
    if (nextStep) {
      selectStep(lessonId, nextStep.id);
      return;
    }

    if (next) {
      const isLoopingToSameActivity =
        next.kind === 'ACTIVITY' &&
        next.lessonId === lessonId &&
        next.stepId === (canonicalStep?.id ?? stepId) &&
        next.activityId === activityId;

      if (isLoopingToSameActivity) {
        console.warn(
          '[learning] next points to current activity, avoiding loop',
          {
            lessonId,
            stepId,
            activityId,
            next
          }
        );
      } else if (next.kind === 'ACTIVITY' && next.stepId && next.activityId) {
        startActivity(next.lessonId, next.stepId, next.activityId);
        return;
      }

      if (next.stepId) {
        selectStep(next.lessonId, next.stepId);
        return;
      }

      selectLesson(next.lessonId);
      return;
    }

    if (isCourseCompleted) {
      goToCompletion();
      return;
    }

    goToOverview();
    return;
  }, [
    goToCompletion,
    goToOverview,
    isCourseCompleted,
    lessonId,
    stepId,
    next,
    nextStep,
    selectLesson,
    selectStep,
    canonicalStep?.id,
    activityId,
    startActivity
  ]);

  const { actionBarConfig } = useActivityFlowIntegration({
    activityId,
    questions,
    answers,
    currentIndex,
    currentQuestion,
    hasResult,
    isSubmitting: submission.isSubmitting,
    hasSubmitError: submission.submit.isError,
    isCourseExpired,
    nextStepLabel,
    onPreviousQuestion: goPrevious,
    onNextQuestion: goNext,
    onExitToLesson,
    onExitForward,
    onSubmit: (payload) => {
      submission.submit.mutate(payload, {
        onSuccess: async (result) => {
          setLocalResult(result);
          await invalidateLearningCache(queryClient, slug, courseId, lessonId);
          toast.success('Atividade enviada com sucesso.');
        },
        onError: () => {
          toast.error(
            'Falha ao enviar atividade. Suas respostas foram mantidas.'
          );
        }
      });
    }
  });

  useEffect(() => {
    setShellMode(isSimTrading ? 'fullscreen' : 'default');
    return () => {
      setShellMode('default');
    };
  }, [isSimTrading, setShellMode]);

  useEffect(() => {
    if (isSimTrading) {
      setActionBar(null);
      return;
    }

    if (!activity || timelineQuery.isLoading || activityQuery.isLoading) {
      setActionBar(null);
      return;
    }

    if (!actionBarConfig) {
      setActionBar(null);
      return;
    }

    setActionBar(actionBarConfig);

    return () => {
      setActionBar(null);
    };
  }, [
    activity,
    activityQuery.isLoading,
    isSimTrading,
    actionBarConfig,
    setActionBar,
    timelineQuery.isLoading
  ]);

  if (!tenantSlug || !params.courseId || !lessonId || !stepId || !activityId) {
    return null;
  }

  if (
    timelineQuery.isLoading ||
    activityQuery.isLoading ||
    shouldShowReviewLoader
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (timelineQuery.error || !timelineQuery.data) {
    return (
      <ActivityErrorState
        title="Não foi possível carregar a timeline"
        description="A aula não retornou os steps necessários para validar a atividade."
        primaryLabel="Voltar para a aula"
        onPrimary={onExitToLessonSafe}
      />
    );
  }

  if (!steps.length) {
    return <ActivityEmptyState />;
  }

  if (!canonicalStep) {
    return (
      <ActivityErrorState
        title="Atividade fora da timeline da aula"
        description="A URL atual não corresponde a uma atividade válida neste contexto."
        primaryLabel="Voltar para a aula"
        onPrimary={onExitToLessonSafe}
      />
    );
  }

  if (canonicalStep.id !== stepId) {
    console.warn(
      '[learning] activity URL mismatch, redirecting to canonical step',
      {
        requestedStepId: stepId,
        canonicalStepId: canonicalStep.id,
        activityId
      }
    );
    return (
      <Navigate
        replace
        to={toLearningActivity(
          tenantSlug,
          courseId,
          lessonId,
          canonicalStep.id,
          activityId
        )}
      />
    );
  }

  if (activityQuery.error || !activity) {
    return (
      <ActivityErrorState
        title="Não foi possível carregar a atividade"
        description="A atividade solicitada não está disponível para esta aula."
        primaryLabel="Voltar para a aula"
        onPrimary={onExitToLessonSafe}
      />
    );
  }

  if (isSimTrading) {
    return (
      <SimTradingChallengeActivityFlow
        slug={slug}
        activityId={activityId}
        onExit={onExitForward}
      />
    );
  }

  if (questions.length === 0) {
    return <ActivityEmptyState />;
  }

  if (!currentQuestion && !hasResult) {
    return (
      <ActivityErrorState
        title="Questão atual indisponível"
        description="Não foi possível resolver a questão atual da atividade."
        primaryLabel="Voltar para a aula"
        onPrimary={onExitToLessonSafe}
      />
    );
  }

  const questionForRender = !hasResult ? currentQuestion : null;

  return (
    <article>
      <header className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {hasResult
            ? 'Atividade Concluída'
            : `Questão ${currentIndex + 1} de ${questions.length}`}
        </p>
        <h1 className="text-2xl font-bold leading-tight">{activity.title}</h1>
      </header>

      {isCourseExpired && !hasResult && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />O prazo do curso
          encerrou. Não é possível enviar novas respostas.
        </div>
      )}

      {hasResult ? (
        <>
          <ActivityResult
            activity={activity}
            review={review}
            localResult={localResult}
            answers={answers}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                resetSession();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              Refazer atividade{' '}
            </button>

            <button
              type="button"
              onClick={onExitForward}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {nextStepLabel}
            </button>
          </div>
        </>
      ) : (
        <ActivityQuestionCard
          activity={activity}
          question={questionForRender!}
          answer={answers[questionForRender!.id] ?? null}
          onChange={(answer) => {
            setAnswer(questionForRender!.id, answer);
          }}
        />
      )}
    </article>
  );
}

function extractActivityIdFromStep(step: LessonStepDTO): string | null {
  const raw = step.content.activityId;
  if (typeof raw !== 'string') return null;

  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}
