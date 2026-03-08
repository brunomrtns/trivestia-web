import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, Video, Image, Zap, Check, Circle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LessonStepDTO, StepType } from '@/types/api';

const STEP_ICONS: Record<
  StepType,
  React.ComponentType<{ className?: string }>
> = {
  CONTENT_TEXT: FileText,
  CONTENT_VIDEO: Video,
  CONTENT_IMAGE: Image,
  ACTIVITY: Zap
};

interface LessonTimelineProps {
  steps: LessonStepDTO[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function LessonTimeline({
  steps,
  currentIndex,
  onSelect
}: LessonTimelineProps) {
  const { t } = useTranslation();

  const STEP_LABELS: Record<StepType, string> = {
    CONTENT_TEXT: t('learning.timeline.stepTypes.text'),
    CONTENT_VIDEO: t('learning.timeline.stepTypes.video'),
    CONTENT_IMAGE: t('learning.timeline.stepTypes.image'),
    ACTIVITY: t('learning.timeline.stepTypes.activity')
  };

  return (
    <nav className="space-y-1" aria-label={t('learning.timeline.ariaLabel')}>
      {steps.map((step, i) => {
        const Icon = STEP_ICONS[step.type] ?? Circle;
        const isCurrent = i === currentIndex;
        const isDone = step.isViewed;

        return (
          <motion.button
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(i)}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all',
              isCurrent
                ? 'bg-primary/10 text-primary font-semibold'
                : isDone
                  ? 'text-muted-foreground hover:bg-accent/50'
                  : 'text-foreground hover:bg-accent/50'
            )}
          >
            {/* Status icon */}
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {isDone && !isCurrent ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="truncate">{step.title}</p>
              <p className="text-xs text-muted-foreground">
                {STEP_LABELS[step.type]}
                {step.estimatedMinutes &&
                  ` · ${t('learning.timeline.minutes', { n: step.estimatedMinutes })}`}
                {step.isOptional && ` · ${t('learning.timeline.optional')}`}
              </p>
            </div>

            {/* Position indicator */}
            <span className="shrink-0 text-xs text-muted-foreground">
              {i + 1}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
