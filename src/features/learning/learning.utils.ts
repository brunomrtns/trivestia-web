import type { QueryClient } from '@tanstack/react-query';
import type {
  CourseInteractiveNext,
  CourseInteractiveDTO,
  DashboardContinueDTO,
  LessonStepDTO
} from '@/types/api';
import {
  toDashboard,
  toLearningOverview,
  toLearningStep,
  toLearningLesson,
  toLearningActivity
} from './learning.routes';

export type StepResolutionFallbackReason =
  | 'TARGET_STEP_NOT_FOUND'
  | 'NEXT_STEP_NOT_FOUND'
  | 'USING_FIRST_PENDING_STEP'
  | 'USING_FIRST_STEP';

export interface StepResolutionResult {
  stepId: string | null;
  fallbackReason: StepResolutionFallbackReason | null;
}

export interface LearningBackTarget {
  label: string;
  path: string;
}

export interface LearningRouteParams {
  courseId?: string;
  lessonId?: string;
  stepId?: string;
  activityId?: string;
}

export function getBackTarget(
  pathname: string,
  params: LearningRouteParams,
  slug: string
): LearningBackTarget {
  const courseId = params.courseId;
  const lessonId = params.lessonId;

  if (!courseId) {
    return {
      label: 'Voltar ao dashboard',
      path: toDashboard(slug)
    };
  }

  if (pathname.includes('/complete')) {
    return {
      label: 'Voltar ao dashboard',
      path: toDashboard(slug)
    };
  }

  if (pathname.includes('/activities/') && lessonId) {
    return {
      label: 'Voltar para a aula',
      path: params.stepId
        ? toLearningStep(slug, courseId, lessonId, params.stepId)
        : toLearningLesson(slug, courseId, lessonId)
    };
  }

  if (pathname.includes('/lessons/')) {
    return {
      label: 'Voltar para o curso',
      path: toLearningOverview(slug, courseId)
    };
  }

  return {
    label: 'Voltar ao dashboard',
    path: toDashboard(slug)
  };
}

export function resolveStepId(
  steps: LessonStepDTO[],
  targetStepId?: string,
  next?: CourseInteractiveNext | null
): string | null {
  return resolveStepIdResult(steps, targetStepId, next).stepId;
}

export function resolveStepIdResult(
  steps: LessonStepDTO[],
  targetStepId?: string,
  next?: CourseInteractiveNext | null
): StepResolutionResult {
  if (!steps.length) {
    return { stepId: null, fallbackReason: null };
  }

  if (targetStepId && steps.some((step) => step.id === targetStepId)) {
    return { stepId: targetStepId, fallbackReason: null };
  }

  if (targetStepId) {
    return logAndResolveFallback(
      'TARGET_STEP_NOT_FOUND',
      steps,
      next,
      targetStepId
    );
  }

  const nextStepId = next?.stepId;
  if (nextStepId && steps.some((step) => step.id === nextStepId)) {
    return { stepId: nextStepId, fallbackReason: null };
  }

  if (nextStepId) {
    return logAndResolveFallback('NEXT_STEP_NOT_FOUND', steps, next, nextStepId);
  }

  const firstPending = steps.find((step) => !step.isViewed && !step.isVirtual);
  if (firstPending) {
    return {
      stepId: firstPending.id,
      fallbackReason: 'USING_FIRST_PENDING_STEP'
    };
  }

  return {
    stepId: steps[0].id,
    fallbackReason: 'USING_FIRST_STEP'
  };
}

function logAndResolveFallback(
  reason: StepResolutionFallbackReason,
  steps: LessonStepDTO[],
  next?: CourseInteractiveNext | null,
  missingStepId?: string
): StepResolutionResult {
  console.warn('[learning] step resolution fallback', {
    reason,
    missingStepId,
    next,
    availableStepIds: steps.map((step) => step.id)
  });

  const firstPending = steps.find((step) => !step.isViewed && !step.isVirtual);
  if (firstPending) {
    return {
      stepId: firstPending.id,
      fallbackReason: reason
    };
  }

  return {
    stepId: steps[0].id,
    fallbackReason: reason
  };
}

export async function invalidateLearningCache(
  queryClient: QueryClient,
  slug: string,
  courseId: string,
  lessonId?: string
): Promise<void> {
  const jobs: Promise<unknown>[] = [
    queryClient.invalidateQueries({
      queryKey: ['course-interactive', slug, courseId]
    }),
    queryClient.invalidateQueries({
      queryKey: ['dashboard-continue', slug]
    })
  ];

  if (lessonId) {
    jobs.push(
      queryClient.invalidateQueries({
        queryKey: ['timeline', slug, lessonId]
      }),
      queryClient.invalidateQueries({
        queryKey: ['lesson-unlock', slug, lessonId]
      })
    );
  }

  await Promise.all(jobs);
}

export function buildContinueUrl(
  data: DashboardContinueDTO,
  slug: string
): string | null {
  if (!data.hasContinuation) return null;
  if (!data.course?.id || !data.lesson?.id) return null;

  const courseId = data.course.id;
  const lessonId = data.lesson.id;
  const next = data.next;

  if (!next) {
    return toLearningLesson(slug, courseId, lessonId);
  }

  if (next.kind === 'STEP') {
    if (next.stepId) {
      return toLearningStep(slug, courseId, lessonId, next.stepId);
    }

    return toLearningLesson(slug, courseId, lessonId);
  }

  if (next.kind === 'ACTIVITY') {
    if (next.activityId && next.stepId) {
      return toLearningActivity(slug, courseId, lessonId, next.stepId, next.activityId);
    }

    return toLearningLesson(slug, courseId, lessonId);
  }

  return toLearningLesson(slug, courseId, lessonId);
}

export function buildLearningNextUrl(
  slug: string,
  courseId: string,
  next: CourseInteractiveNext | null
): string | null {
  if (!next) return null;

  if (next.kind === 'STEP') {
    if (next.stepId) {
      return toLearningStep(slug, courseId, next.lessonId, next.stepId);
    }

    return toLearningLesson(slug, courseId, next.lessonId);
  }

  if (next.kind === 'ACTIVITY') {
    if (next.stepId && next.activityId) {
      return toLearningActivity(slug, courseId, next.lessonId, next.stepId, next.activityId);
    }

    if (next.stepId) {
      return toLearningStep(slug, courseId, next.lessonId, next.stepId);
    }

    return toLearningLesson(slug, courseId, next.lessonId);
  }

  return toLearningLesson(slug, courseId, next.lessonId);
}

export function isLearningCourseCompleted(
  progress: CourseInteractiveDTO['progress'] | null,
  next: CourseInteractiveNext | null
): boolean {
  return Boolean(progress && progress.percent >= 100 && !next);
}
