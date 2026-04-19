import { useEffect, useRef, type RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContextualNavVisibility } from './useContextualNavVisibility';

interface ContextualNavControlBarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  currentLabel: string;
  nextLabel?: string;
  progressPercent?: number;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  desktopOnly?: boolean;
  onInsetChange?: (insetPx: number) => void;
}

export function ContextualNavControlBar({
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
  currentLabel,
  nextLabel = 'Próximo',
  progressPercent,
  scrollContainerRef,
  desktopOnly = false,
  onInsetChange
}: ContextualNavControlBarProps) {
  const mobileBarRef = useRef<HTMLDivElement | null>(null);
  const desktopBarRef = useRef<HTMLDivElement | null>(null);

  const {
    isMobileViewport,
    isVisible,
    onDesktopBarMouseEnter,
    onDesktopBarMouseLeave,
    markUserEngaged
  } = useContextualNavVisibility({
    enabled: Boolean(onNext || onPrevious),
    scrollContainerRef
  });

  const percent =
    typeof progressPercent === 'number' ? Math.max(0, Math.min(progressPercent, 100)) : undefined;

  useEffect(() => {
    if (!onInsetChange) return;

    if (!isVisible) {
      onInsetChange(0);
      return;
    }

    const element = isMobileViewport ? mobileBarRef.current : desktopBarRef.current;
    if (!element) {
      onInsetChange(0);
      return;
    }

    const updateInset = () => {
      const rect = element.getBoundingClientRect();
      const overlaySpace = Math.max(0, Math.round(window.innerHeight - rect.top));
      onInsetChange(overlaySpace);
    };

    const animationFrame = window.requestAnimationFrame(updateInset);
    const resizeObserver = new ResizeObserver(updateInset);
    resizeObserver.observe(element);
    window.addEventListener('resize', updateInset);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateInset);
      onInsetChange(0);
    };
  }, [isMobileViewport, isVisible, onInsetChange]);

  if (isMobileViewport && desktopOnly) {
    return null;
  }

  const desktopClasses = isVisible
    ? 'translate-y-0 opacity-100'
    : 'pointer-events-none translate-y-3 opacity-0';

  const mobileClasses = isVisible
    ? 'translate-y-0 opacity-100'
    : 'pointer-events-none translate-y-3 opacity-0';

  if (isMobileViewport) {
    return (
      <div
        ref={mobileBarRef}
        className={`fixed inset-x-3 bottom-3 z-40 rounded-xl border border-border/70 bg-background/95 px-2.5 py-1.5 shadow-lg supports-[backdrop-filter]:bg-background/82 backdrop-blur-xl transition-[opacity,transform] duration-150 ease-out lg:hidden ${mobileClasses}`}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              markUserEngaged();
              onPrevious?.();
            }}
            disabled={!canGoBack || !onPrevious}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-background/70 text-foreground/80 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-medium text-muted-foreground">
              {currentLabel}
            </p>
            {percent !== undefined ? (
              <p className="text-[10px] text-muted-foreground/75">{Math.round(percent)}%</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              markUserEngaged();
              onNext?.();
            }}
            disabled={!canGoForward || !onNext}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="max-w-[128px] truncate">{nextLabel}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
          </button>

        </div>
      </div>
    );
  }

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 hidden h-28 pointer-events-none xl:flex">
      <div
        className="pointer-events-auto absolute inset-x-0 bottom-0 h-28"
        onMouseEnter={onDesktopBarMouseEnter}
        onMouseLeave={onDesktopBarMouseLeave}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        <div
          ref={desktopBarRef}
          className={`pointer-events-auto isolate min-w-[340px] max-w-[560px] overflow-hidden rounded-xl border border-border/70 bg-background/95 px-2 py-1.5 shadow-xl supports-[backdrop-filter]:bg-background/82 backdrop-blur-xl transition-[opacity,transform] duration-170 ease-out ${desktopClasses}`}
          onMouseEnter={onDesktopBarMouseEnter}
          onMouseLeave={onDesktopBarMouseLeave}
        >
          {percent !== undefined ? (
            <div className="mb-1 h-1 overflow-hidden rounded-full bg-muted/70">
              <div
                className="h-full bg-primary/85 transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          ) : null}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                markUserEngaged();
                onPrevious?.();
              }}
              disabled={!canGoBack || !onPrevious}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 bg-background/70 px-2.5 text-[11px] font-medium text-foreground/90 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" />
              Anterior
            </button>

            <div className="min-w-0 flex-1 px-1 text-center">
              <p className="truncate text-[11px] text-muted-foreground">{currentLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                markUserEngaged();
                onNext?.();
              }}
              disabled={!canGoForward || !onNext}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="max-w-[160px] truncate">{nextLabel}</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
