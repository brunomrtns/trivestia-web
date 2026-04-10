import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLearningData, useLearningNav } from '@/features/learning/learning.context';

export default function LearningActionBar() {
  const { actionBar } = useLearningNav();
  const { progress } = useLearningData();

  if (!actionBar) {
    return null;
  }

  const percent = progress?.percent ?? 0;

  return (
    <footer className="absolute inset-x-0 bottom-0 z-30 h-[72px] border-t border-border/50 bg-background/90 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] backdrop-blur-lg md:h-20">
      <div className="absolute inset-x-0 top-0 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <button
          type="button"
          onClick={actionBar.onPrevious}
          disabled={!actionBar.canGoBack || !actionBar.onPrevious}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="min-w-0 shrink text-center">
          <span className="truncate text-sm font-medium text-muted-foreground">
            {actionBar.currentLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={actionBar.onNext}
          disabled={!actionBar.canGoForward || !actionBar.onNext}
          className="inline-flex h-10 min-w-[140px] items-center justify-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:min-w-[160px]"
        >
          <span className="truncate">{actionBar.nextLabel ?? 'Próximo'}</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </footer>
  );
}
