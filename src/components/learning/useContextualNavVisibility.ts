import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface UseContextualNavVisibilityOptions {
  enabled: boolean;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  baseDesktopEdgeThresholdPx?: number;
  adaptiveDesktopEdgeThresholdPx?: number;
  nearEndThresholdActive?: number;
  mobileTransientMs?: number;
  activationDebounceMs?: number;
  desktopExitBufferPx?: number;
  desktopStickyZonePx?: number;
}

export function useContextualNavVisibility({
  enabled,
  scrollContainerRef,
  baseDesktopEdgeThresholdPx = 84,
  adaptiveDesktopEdgeThresholdPx = 44,
  nearEndThresholdActive = 0.9,
  mobileTransientMs = 1200,
  activationDebounceMs = 100,
  desktopExitBufferPx = 28,
  desktopStickyZonePx = 124
}: UseContextualNavVisibilityOptions) {
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });
  const [isPointerNearBottom, setIsPointerNearBottom] = useState(false);
  const [isHoveringBar, setIsHoveringBar] = useState(false);
  const [isTransientVisible, setIsTransientVisible] = useState(false);
  const [engagementCount, setEngagementCount] = useState(0);
  const [lastInteractionAt, setLastInteractionAt] = useState<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const scrollStopTimerRef = useRef<number | null>(null);
  const activationTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const clearScrollStopTimer = useCallback(() => {
    if (scrollStopTimerRef.current) {
      window.clearTimeout(scrollStopTimerRef.current);
      scrollStopTimerRef.current = null;
    }
  }, []);

  const clearActivationTimer = useCallback(() => {
    if (activationTimerRef.current) {
      window.clearTimeout(activationTimerRef.current);
      activationTimerRef.current = null;
    }
  }, []);

  const showTransient = useCallback(
    (delayMs: number) => {
      setIsTransientVisible(true);
      clearHideTimer();

      hideTimerRef.current = window.setTimeout(() => {
        setIsTransientVisible(false);
      }, delayMs);
    },
    [clearHideTimer]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);

    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  const markInteracted = useCallback(() => {
    setEngagementCount((value) => value + 1);
    setLastInteractionAt(Date.now());
  }, []);

  const shouldUseActiveBehavior =
    engagementCount >= 2 ||
    (lastInteractionAt !== null && Date.now() - lastInteractionAt < 10 * 60 * 1000);

  const desktopEdgeThresholdPx = shouldUseActiveBehavior
    ? baseDesktopEdgeThresholdPx
    : adaptiveDesktopEdgeThresholdPx;

  useEffect(() => {
    if (!enabled) {
      setIsPointerNearBottom(false);
      setIsHoveringBar(false);
      setIsTransientVisible(false);
      setEngagementCount(0);
      setLastInteractionAt(null);
      clearHideTimer();
      clearScrollStopTimer();
      clearActivationTimer();
      return;
    }

    const scrollContainer = scrollContainerRef?.current;

    const getScrollMetrics = () => {
      if (scrollContainer) {
        return {
          scrollTop: scrollContainer.scrollTop,
          maxScroll: scrollContainer.scrollHeight - scrollContainer.clientHeight
        };
      }

      return {
        scrollTop: window.scrollY,
        maxScroll: document.documentElement.scrollHeight - window.innerHeight
      };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isMobileViewport) return;

      const entryThreshold = desktopEdgeThresholdPx;
      const stickyThreshold = Math.max(
        desktopEdgeThresholdPx + desktopExitBufferPx,
        desktopStickyZonePx
      );

      const isNearBottom = event.clientY >= window.innerHeight - entryThreshold;
      const isInStickyZone = event.clientY >= window.innerHeight - stickyThreshold;

      if (isNearBottom) {
        clearActivationTimer();
        activationTimerRef.current = window.setTimeout(() => {
          setIsPointerNearBottom(true);
          setIsTransientVisible(false);
        }, activationDebounceMs);
        return;
      }

      clearActivationTimer();

      if (!isInStickyZone && !isHoveringBar) {
        setIsPointerNearBottom(false);
        clearHideTimer();
        setIsTransientVisible(false);
      }
    };

    const onMouseLeaveWindow = () => {
      clearActivationTimer();
      setIsPointerNearBottom(false);
      if (!isHoveringBar) {
        setIsTransientVisible(false);
      }
    };

    const onScroll = () => {
      const { scrollTop, maxScroll } = getScrollMetrics();
      const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;
      const nearEnd = ratio >= nearEndThresholdActive;

      if (nearEnd && shouldUseActiveBehavior) {
        showTransient(mobileTransientMs);
      }

      clearScrollStopTimer();
      scrollStopTimerRef.current = window.setTimeout(() => {
        if (!isMobileViewport) {
          return;
        }
        showTransient(mobileTransientMs);
      }, 160);
    };

    const onTouchStart = () => {
      if (!isMobileViewport) return;
      markInteracted();
      showTransient(mobileTransientMs);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeaveWindow, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeaveWindow);
      window.removeEventListener('touchstart', onTouchStart);

      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', onScroll);
      } else {
        window.removeEventListener('scroll', onScroll);
      }

      clearHideTimer();
      clearScrollStopTimer();
      clearActivationTimer();
    };
  }, [
    activationDebounceMs,
    adaptiveDesktopEdgeThresholdPx,
    baseDesktopEdgeThresholdPx,
    clearActivationTimer,
    clearHideTimer,
    clearScrollStopTimer,
    desktopEdgeThresholdPx,
    desktopExitBufferPx,
    desktopStickyZonePx,
    enabled,
    isHoveringBar,
    isMobileViewport,
    isPointerNearBottom,
    markInteracted,
    mobileTransientMs,
    nearEndThresholdActive,
    shouldUseActiveBehavior,
    scrollContainerRef,
    showTransient
  ]);

  const onDesktopBarMouseEnter = useCallback(() => {
    if (isMobileViewport) return;
    markInteracted();
    setIsHoveringBar(true);
    setIsTransientVisible(false);
    clearActivationTimer();
    clearHideTimer();
  }, [clearActivationTimer, clearHideTimer, isMobileViewport, markInteracted]);

  const onDesktopBarMouseLeave = useCallback(() => {
    if (isMobileViewport) return;
    setIsHoveringBar(false);
    if (!isPointerNearBottom) {
      setIsTransientVisible(false);
    }
  }, [isMobileViewport, isPointerNearBottom]);

  const markUserEngaged = useCallback(() => {
    markInteracted();
  }, [markInteracted]);

  return {
    isMobileViewport,
    isVisible: isPointerNearBottom || isHoveringBar || isTransientVisible,
    onDesktopBarMouseEnter,
    onDesktopBarMouseLeave,
    markUserEngaged
  };
}
