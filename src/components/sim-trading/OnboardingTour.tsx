import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  BarChart3,
  ListOrdered,
  TrendingUp,
  FileText,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTutorialProgress } from './useTutorialProgress';

// ─── Tutorial Steps ───────────────────────────────────────────────────────────

interface TutorialStep {
  id: string;
  icon: React.ReactNode;
  highlightArea?: string;
}

const STEPS: TutorialStep[] = [
  {
    id: 'chart',
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
    highlightArea: 'chart'
  },
  {
    id: 'playback',
    icon: <ListOrdered className="h-5 w-5 text-blue-400" />,
    highlightArea: 'playback'
  },
  {
    id: 'order',
    icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
    highlightArea: 'order-ticket'
  },
  {
    id: 'position',
    icon: <FileText className="h-5 w-5 text-yellow-400" />,
    highlightArea: 'position-panel'
  },
  {
    id: 'tabs',
    icon: <BarChart3 className="h-5 w-5 text-muted-foreground" />,
    highlightArea: 'bottom-tabs'
  },
  {
    id: 'submit',
    icon: <Send className="h-5 w-5 text-primary" />,
    highlightArea: 'submit'
  }
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingTourProps {
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingTour({ className }: OnboardingTourProps) {
  const tutorial = useTutorialProgress();
  const { t } = useTranslation();

  const handleNext = useCallback(() => {
    if (tutorial.currentStep >= STEPS.length - 1) {
      tutorial.complete();
    } else {
      tutorial.nextStep();
    }
  }, [tutorial]);

  const handlePrev = useCallback(() => {
    if (tutorial.currentStep > 0) {
      tutorial.setStep(tutorial.currentStep - 1);
    }
  }, [tutorial]);

  // Don't render if completed or dismissed
  if (tutorial.completed || tutorial.dismissed) return null;

  const step = STEPS[tutorial.currentStep];
  if (!step) return null;

  const isFirst = tutorial.currentStep === 0;
  const isLast = tutorial.currentStep === STEPS.length - 1;
  const progress = ((tutorial.currentStep + 1) / STEPS.length) * 100;

  return (
    <div
      className={cn(
        'rounded-xl border border-primary/20 bg-card shadow-lg',
        className
      )}
    >
      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-t-xl bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {step.icon}
            <div>
              <h3 className="text-sm font-bold">
                {t(`sim.tutorial.steps.${step.id}.title`)}
              </h3>
              <span className="text-xs text-muted-foreground">
                {t('sim.tutorial.stepOf', {
                  current: tutorial.currentStep + 1,
                  total: STEPS.length
                })}
              </span>
            </div>
          </div>
          <button
            onClick={tutorial.dismiss}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title={t('sim.tutorial.closeTitle')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Description */}
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          {t(`sim.tutorial.steps.${step.id}.description`)}
        </p>

        {/* Step dots */}
        <div className="mb-3 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => tutorial.setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === tutorial.currentStep
                  ? 'w-4 bg-primary'
                  : i < tutorial.currentStep
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-accent disabled:opacity-30"
          >
            <ChevronLeft className="h-3 w-3" />
            {t('common.pagination.previous')}
          </button>

          <div className="flex-1" />

          <button
            onClick={tutorial.dismiss}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            {t('sim.tutorial.skipButton')}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {isLast ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                {t('sim.tutorial.finishButton')}
              </>
            ) : (
              <>
                {t('common.pagination.next')}
                <ChevronRight className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
