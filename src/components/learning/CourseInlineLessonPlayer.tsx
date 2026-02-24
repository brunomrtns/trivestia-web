import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { stepsEndpoints } from '@/services/endpoints/steps.endpoints';
import { LessonTimeline } from '@/components/learning/LessonTimeline';
import { StepPlayer } from '@/components/learning/StepPlayer';

interface CourseInlineLessonPlayerProps {
  lessonId: string;
  /** If a specific stepId should be focused on mount */
  initialStepId?: string;
  /** Called when user finishes the last step of the lesson */
  onLessonComplete?: () => void;
}

export function CourseInlineLessonPlayer({
  lessonId,
  initialStepId,
  onLessonComplete
}: CourseInlineLessonPlayerProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['timeline', lessonId],
    queryFn: () => stepsEndpoints.getTimeline(lessonId),
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

    stepsEndpoints.markViewed(lessonId, activeStep.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['timeline', lessonId] });
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
        <p>Esta aula ainda não possui conteúdo.</p>
      </div>
    );
  }

  const isLastStep = currentStep >= steps.length - 1;

  return (
    <div className="flex gap-6">
      {/* Mini timeline — hidden on small screens, shown on xl */}
      <aside className="hidden w-56 shrink-0 xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border bg-card/50 p-2">
          <LessonTimeline
            steps={steps}
            currentIndex={currentStep}
            onSelect={setCurrentStep}
          />
        </div>
      </aside>

      {/* Player area */}
      <div className="flex-1 min-w-0">
        {/* Lesson title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4"
        >
          <h2 className="text-lg font-bold">{timeline?.lesson.title}</h2>
          <p className="text-xs text-muted-foreground">
            Etapa {currentStep + 1} de {steps.length}
            {timeline?.progress
              ? ` · ${timeline.progress.viewed}/${timeline.progress.total} concluídas`
              : ''}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeStep && (
            <StepPlayer
              key={activeStep.id}
              step={activeStep}
              lessonId={lessonId}
            />
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <span className="text-xs text-muted-foreground xl:hidden">
            {currentStep + 1}/{steps.length}
          </span>

          {isLastStep ? (
            <button
              onClick={onLessonComplete}
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
            >
              Concluir aula
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
