import type { RefObject } from 'react';
import {
  useLearningData,
  useLearningNav
} from '@/features/learning/learning.context';
import { ContextualNavControlBar } from './ContextualNavControlBar';

interface LearningActionBarProps {
  scrollContainerRef?: RefObject<HTMLElement | null>;
  onInsetChange?: (insetPx: number) => void;
}

export default function LearningActionBar({
  scrollContainerRef,
  onInsetChange
}: LearningActionBarProps) {
  const { actionBar } = useLearningNav();
  const { progress } = useLearningData();

  if (!actionBar) {
    return null;
  }

  const percent = progress?.percent ?? 0;
  return (
    <ContextualNavControlBar
      canGoBack={actionBar.canGoBack}
      canGoForward={actionBar.canGoForward}
      onPrevious={actionBar.onPrevious}
      onNext={actionBar.onNext}
      currentLabel={actionBar.currentLabel}
      nextLabel={actionBar.nextLabel ?? 'Próximo'}
      progressPercent={percent}
      scrollContainerRef={scrollContainerRef}
      onInsetChange={onInsetChange}
    />
  );
}
