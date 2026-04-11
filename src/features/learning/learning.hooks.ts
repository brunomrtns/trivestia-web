import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult
} from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth.store';
import { courseInteractiveEndpoints } from '@/services/endpoints/course-interactive.endpoints';
import { dashboardEndpoints } from '@/services/endpoints/dashboard.endpoints';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { progressEndpoints } from '@/services/endpoints/progress.endpoints';
import { stepsEndpoints } from '@/services/endpoints/steps.endpoints';
import type {
  Activity,
  CourseInteractiveDTO,
  DashboardContinueDTO,
  LessonTimelineDTO,
  LessonUnlockDTO,
  SubmissionResponse,
  SubmitActivityRequest
} from '@/types/api';
import { invalidateLearningCache } from './learning.utils';

export function useCourseInteractive(slug: string, courseId: string) {
  return useQuery({
    queryKey: ['course-interactive', slug, courseId],
    queryFn: () =>
      courseInteractiveEndpoints.getCourseInteractive(slug, courseId),
    enabled: Boolean(slug && courseId),
    staleTime: 5 * 60 * 1000
  });
}

export function useLessonTimeline(slug: string, lessonId: string) {
  return useQuery({
    queryKey: ['timeline', slug, lessonId],
    queryFn: () => stepsEndpoints.getTimeline(slug, lessonId),
    enabled: Boolean(slug && lessonId)
  });
}

export function useActivity(
  slug: string,
  lessonId: string,
  activityId: string
) {
  return useQuery({
    queryKey: ['activity', slug, lessonId, activityId],
    queryFn: () => learningEndpoints.getActivity(slug, lessonId, activityId),
    enabled: Boolean(slug && lessonId && activityId),
    staleTime: 10 * 1000
  });
}

export function useActivitySubmission(slug: string, activityId?: string) {
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: (data: SubmitActivityRequest) =>
      progressEndpoints.submit(slug, data),
    onSuccess: () => {
      if (!activityId) return;
      void queryClient.invalidateQueries({
        queryKey: ['submission-review', slug, activityId]
      });
    }
  });

  const review = useQuery({
    queryKey: ['submission-review', slug, activityId],
    queryFn: async (): Promise<SubmissionResponse | null> => {
      if (!activityId) return null;

      try {
        return await progressEndpoints.getSubmission(slug, activityId);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(slug && activityId),
    staleTime: 10 * 1000,
    retry: false
  });

  return {
    submit,
    review,
    isSubmitting: submit.isPending,
    reviewData: review.data ?? null
  };
}

export function useLessonUnlock(slug: string, lessonId: string) {
  return useQuery({
    queryKey: ['lesson-unlock', slug, lessonId],
    queryFn: () => progressEndpoints.isLessonUnlocked(slug, lessonId),
    enabled: Boolean(slug && lessonId),
    staleTime: 5 * 60 * 1000
  });
}

export function useBatchLessonUnlock(
  slug: string,
  lessonIds: string[]
): Map<string, boolean> {
  const results = useQueries({
    queries: lessonIds.map((lessonId) => ({
      queryKey: ['lesson-unlock', slug, lessonId],
      queryFn: () => progressEndpoints.isLessonUnlocked(slug, lessonId),
      enabled: Boolean(slug && lessonId),
      staleTime: 5 * 60 * 1000
    }))
  });

  return useMemo(() => {
    const map = new Map<string, boolean>();
    results.forEach((result, index) => {
      const lessonId = lessonIds[index];
      map.set(lessonId, result.data ? result.data.unlocked : true);
    });
    return map;
  }, [lessonIds, results]);
}

interface StepViewTrackerOptions {
  slug: string;
  courseId: string;
  lessonId: string;
}

interface TrackStepInput {
  stepId: string;
  isViewed: boolean;
  isVirtual: boolean;
}

const MARK_VIEWED_MAX_ATTEMPTS = 2;

export function useStepViewTracker(options: StepViewTrackerOptions) {
  const queryClient = useQueryClient();
  const optionsRef = useRef(options);
  const queueRef = useRef<string[]>([]);
  const pendingSetRef = useRef(new Set<string>());
  const inFlightSetRef = useRef(new Set<string>());
  const successSetRef = useRef(new Set<string>());
  const attemptCountRef = useRef(new Map<string, number>());
  const flushPromiseRef = useRef<Promise<void> | null>(null);
  const generationRef = useRef(0);

  const flushQueue = useCallback((): Promise<void> => {
    if (flushPromiseRef.current) {
      return flushPromiseRef.current;
    }

    const generationAtStart = generationRef.current;

    const run = async () => {
      while (queueRef.current.length > 0) {
        if (generationRef.current !== generationAtStart) return;

        const currentStepId = queueRef.current.shift();
        if (!currentStepId) continue;

        pendingSetRef.current.delete(currentStepId);
        inFlightSetRef.current.add(currentStepId);

        try {
          const current = optionsRef.current;
          const attempts =
            (attemptCountRef.current.get(currentStepId) ?? 0) + 1;
          attemptCountRef.current.set(currentStepId, attempts);

          await stepsEndpoints.markViewed(
            current.slug,
            current.lessonId,
            currentStepId
          );

          if (generationRef.current === generationAtStart) {
            successSetRef.current.add(currentStepId);
            attemptCountRef.current.delete(currentStepId);

            await invalidateLearningCache(
              queryClient,
              current.slug,
              current.courseId,
              current.lessonId
            );
          }
        } catch {
          if (generationRef.current === generationAtStart) {
            const attempts = attemptCountRef.current.get(currentStepId) ?? 1;
            if (attempts < MARK_VIEWED_MAX_ATTEMPTS) {
              queueRef.current.push(currentStepId);
              pendingSetRef.current.add(currentStepId);
            }

            successSetRef.current.delete(currentStepId);
          }
        } finally {
          inFlightSetRef.current.delete(currentStepId);
        }
      }
    };

    flushPromiseRef.current = run().finally(() => {
      if (generationRef.current === generationAtStart) {
        flushPromiseRef.current = null;
        if (queueRef.current.length > 0) {
          void flushQueue();
        }
      }
    });

    return flushPromiseRef.current;
  }, [queryClient]);

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;

    optionsRef.current = {
      slug: options.slug,
      courseId: options.courseId,
      lessonId: options.lessonId
    };

    const pendingToRequeue = Array.from(pendingSetRef.current);
    queueRef.current = pendingToRequeue;
    pendingSetRef.current.clear();
    successSetRef.current.clear();
    attemptCountRef.current.clear();

    if (inFlightSetRef.current.size === 0) {
      flushPromiseRef.current = null;
    }

    if (pendingToRequeue.length > 0 && !flushPromiseRef.current) {
      void Promise.resolve().then(() => {
        if (generationRef.current === generation) {
          void flushQueue();
        }
      });
    }
  }, [options.courseId, options.lessonId, options.slug, flushQueue]);

  const markViewed = useCallback(
    (input: TrackStepInput) => {
      if (input.isViewed || input.isVirtual) return;
      if (pendingSetRef.current.has(input.stepId)) return;
      if (inFlightSetRef.current.has(input.stepId)) return;
      if (successSetRef.current.has(input.stepId)) return;

      queueRef.current.push(input.stepId);
      pendingSetRef.current.add(input.stepId);
      void flushQueue();
    },
    [flushQueue]
  );

  return { markViewed };
}

export function useDashboardContinue(
  slug: string
): UseQueryResult<DashboardContinueDTO, Error> {
  return useQuery({
    queryKey: ['dashboard-continue', slug],
    queryFn: () => dashboardEndpoints.getContinue(slug),
    enabled: Boolean(slug),
    staleTime: 2 * 60 * 1000
  });
}

export function useLearningV2Flag(): boolean {
  return useAuthStore((state) => state.useLearningV2);
}

export type LearningCourseResult = UseQueryResult<CourseInteractiveDTO, Error>;
export type LearningTimelineResult = UseQueryResult<LessonTimelineDTO, Error>;
export type LearningActivityResult = UseQueryResult<Activity, Error>;
export type LearningUnlockResult = UseQueryResult<LessonUnlockDTO, Error>;
