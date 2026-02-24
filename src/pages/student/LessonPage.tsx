import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Loader2,
  BookOpen
} from 'lucide-react';
import { stepsEndpoints } from '@/services/endpoints/steps.endpoints';
import { LessonTimeline } from '@/components/learning/LessonTimeline';
import { StepPlayer } from '@/components/learning/StepPlayer';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  const lessonTitle: string | undefined = (
    location.state as { lessonTitle?: string } | null
  )?.lessonTitle;
  const courseId: string | undefined = (
    location.state as { courseId?: string } | null
  )?.courseId;

  const [currentStep, setCurrentStep] = useState(0);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['timeline', lessonId],
    queryFn: () => stepsEndpoints.getTimeline(lessonId!),
    enabled: !!lessonId
  });

  // Mark step as viewed when displayed
  useEffect(() => {
    if (!timeline?.steps.length) return;
    const step = timeline.steps[currentStep];
    if (!step || step.isViewed || step.isVirtual) return;

    stepsEndpoints.markViewed(lessonId!, step.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['timeline', lessonId] });
    });
  }, [currentStep, timeline, lessonId, queryClient]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const steps = timeline?.steps ?? [];
  const activeStep = steps[currentStep];

  return (
    <div className="container max-w-5xl py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {courseId ? (
            <Link
              to={`/courses/${courseId}`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar ao curso
            </Link>
          ) : (
            <Link
              to="/courses"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Cursos
            </Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold">
          {timeline?.lesson.title ?? lessonTitle ?? 'Atividades da aula'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {`Etapa ${currentStep + 1} de ${steps.length}${timeline?.progress ? ` · ${timeline.progress.viewed}/${timeline.progress.total} concluídas` : ''}`}
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* ─── Interactive mode (always) ─────────────────────────────────────── */}
      {!isLoading && (
        <>
          {steps.length > 0 ? (
            <div className="flex gap-8">
              {/* Sidebar */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border bg-card p-3 shadow-sm">
                  <LessonTimeline
                    steps={steps}
                    currentIndex={currentStep}
                    onSelect={setCurrentStep}
                  />
                </div>
              </aside>

              {/* Content area */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {activeStep && (
                    <StepPlayer
                      key={activeStep.id}
                      step={activeStep}
                      lessonId={lessonId!}
                    />
                  )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>

                  {/* Mobile step indicator */}
                  <span className="text-xs text-muted-foreground lg:hidden">
                    {currentStep + 1}/{steps.length}
                  </span>

                  <button
                    disabled={currentStep >= steps.length - 1}
                    onClick={() => setCurrentStep((s) => s + 1)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center text-muted-foreground">
      <Zap className="mx-auto mb-4 h-12 w-12 opacity-30" />
      <p>Nenhuma atividade disponível nesta aula ainda.</p>
    </div>
  );
}
