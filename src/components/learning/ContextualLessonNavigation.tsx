import { ContextualNavControlBar } from './ContextualNavControlBar';

interface ContextualLessonNavigationProps {
  currentIndex: number;
  total: number;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
  nextLabel?: string;
  progressPercent?: number;
  onInsetChange?: (insetPx: number) => void;
}

export function ContextualLessonNavigation({
  currentIndex,
  total,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
  nextLabel = 'Próximo',
  progressPercent,
  onInsetChange
}: ContextualLessonNavigationProps) {
  return (
    <ContextualNavControlBar
      canGoBack={canGoBack}
      canGoForward={canGoForward}
      onPrevious={onPrevious}
      onNext={onNext}
      currentLabel={`Aula ${Math.max(currentIndex + 1, 1)} de ${Math.max(total, 1)}`}
      nextLabel={nextLabel}
      progressPercent={progressPercent}
      onInsetChange={onInsetChange}
    />
  );
}
