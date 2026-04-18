import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { stepsEndpoints } from '@/services/endpoints/steps.endpoints';
import { LessonTimeline } from '@/components/learning/LessonTimeline';
import { StepPlayer } from '@/components/learning/StepPlayer';

interface CourseInlineLessonPlayerProps {
  slug: string;
  lessonId: string;
  /** If a specific stepId should be focused on mount */
  initialStepId?: string;
  /** Called when user finishes the last step of the lesson */
  onLessonComplete?: () => void;
}

export function CourseInlineLessonPlayer({
  slug,
  lessonId,
  initialStepId,
  onLessonComplete
}: CourseInlineLessonPlayerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['timeline', slug, lessonId],
    queryFn: () => stepsEndpoints.getTimeline(slug, lessonId),
    staleTime: 2 * 60 * 1000
  });

  const steps = timeline?.steps ?? [];
  const activeStep = steps[currentStep];

  // Resolve initialStepId to index on first load
  useEffect(() => {
    if (!initialStepId || !steps.length) return;
    const idx = steps.findIndex((s) => s.id === initialStepId);
    if (idx >= 0) setCurrentStep(idx);
  }, [initialStepId, steps]);

  // Mark step as viewed
  useEffect(() => {
    if (!activeStep || activeStep.isViewed || activeStep.isVirtual) return;

    stepsEndpoints.markViewed(slug, lessonId, activeStep.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['timeline', slug, lessonId] });
    });
  }, [activeStep, lessonId, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>{t('app.lessonPlayer.noContent')}</p>
      </div>
    );
  }

  const isLastStep = currentStep >= steps.length - 1;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,_1fr)_260px]">
      {/* Player area */}
      <div className="min-w-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('app.lessonPlayer.stepOf', {
                n: currentStep + 1,
                total: steps.length
              })}
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              {timeline?.lesson.title}
            </h2>
            {timeline?.progress && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t('app.lessonPlayer.completedSuffix', {
                  viewed: timeline.progress.viewed,
                  total: timeline.progress.total
                })}
              </p>
            )}
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {currentStep + 1}/{steps.length}
          </span>
        </motion.div>

        <div className="rounded-2xl border bg-card/60 p-4 shadow-sm md:p-6">
          <AnimatePresence mode="wait">
            {activeStep && (
              <StepPlayer
                key={activeStep.id}
                slug={slug}
                step={activeStep}
                lessonId={lessonId}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('common.pagination.previous')}
          </button>

          {isLastStep ? (
            <button
              onClick={onLessonComplete}
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
            >
              {t('app.lessonPlayer.completeLesson')}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
            >
              {t('app.lesson.nav.next')}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <aside className="hidden xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border bg-card/50 p-3">
          <LessonTimeline
            steps={steps}
            currentIndex={currentStep}
            onSelect={setCurrentStep}
          />
        </div>
      </aside>
    </div>
  );
}
