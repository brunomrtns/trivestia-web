import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LearningDataProvider,
  LearningNavProvider,
  useLearningData,
  useLearningNav
} from '@/features/learning/learning.context';
import { useLearningV2Flag } from '@/features/learning/learning.hooks';
import { toLegacyInteractive } from '@/features/learning/learning.routes';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { LearningPhase1Placeholder } from './LearningPhase1Placeholder';
import LearningActionBar from './LearningActionBar';
import LearningHeader from './LearningHeader';
import LearningOutline from './LearningOutline';

const CONTENT_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15, ease: 'easeOut' }
};

export default function LearningShell() {
  const isLearningV2Enabled = useLearningV2Flag();
  const { tenantSlug, courseId } = useParams<{
    tenantSlug: string;
    courseId: string;
  }>();

  if (!tenantSlug || !courseId) {
    return <LearningPhase1Placeholder componentName="LearningShell" />;
  }

  if (!isLearningV2Enabled) {
    return <Navigate replace to={toLegacyInteractive(tenantSlug, courseId)} />;
  }

  return (
    <LearningDataProvider slug={tenantSlug} courseId={courseId}>
      <LearningNavProvider>
        <LearningShellLayout />
      </LearningNavProvider>
    </LearningDataProvider>
  );
}

function LearningShellLayout() {
  const { isLoading, error, refetch } = useLearningData();
  const { actionBar, shellMode } = useLearningNav();
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const [actionBarInsetPx, setActionBarInsetPx] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });

  const isFullscreen = shellMode === 'fullscreen';
  const hasActionBar = Boolean(actionBar) && !isFullscreen;
  const shouldReserveActionBarSpace = hasActionBar && isMobileViewport;

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

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">
            Não foi possível carregar o curso
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            O shell de aprendizagem não conseguiu carregar os dados iniciais.
          </p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-background">
      {!isFullscreen && <LearningHeader />}

      <div
        className={`absolute inset-x-0 overflow-hidden ${
          isFullscreen
            ? 'inset-y-0'
            : shouldReserveActionBarSpace
              ? 'top-12 bottom-[72px] md:top-14 md:bottom-20'
              : 'top-12 bottom-0 md:top-14'
        }`}
      >
        <div className="flex h-full min-h-0">
          {!isFullscreen &&
            (isLoading ? (
              <div className="hidden w-[240px] shrink-0 border-r bg-card lg:block">
                <div className="h-10 border-b" />
                <div className="space-y-3 p-3">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="ml-3 space-y-2">
                    <div className="h-8 w-full animate-pulse rounded bg-muted" />
                    <div className="h-8 w-full animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            ) : (
              <LearningOutline />
            ))}

          <main ref={contentScrollRef} className="flex-1 min-h-0 min-w-0 overflow-y-auto">
            {isLoading ? (
              <div className="mx-auto max-w-4xl space-y-4 p-5 md:p-10">
                <div className="h-7 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="mt-6 h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              </div>
            ) : isFullscreen ? (
              <div className="h-full w-full">
                <ShellContentTransition />
              </div>
            ) : (
              <div
                className="min-h-full w-full px-4 py-6 transition-[padding-bottom] duration-150 ease-out md:px-10 md:py-10 xl:px-16"
                style={{
                  paddingBottom: `calc(1.5rem + ${Math.max(actionBarInsetPx - 8, 0)}px)`
                }}
              >
                <ShellContentTransition />
              </div>
            )}
          </main>
        </div>
      </div>

      {!isFullscreen && (
        <LearningActionBar
          scrollContainerRef={contentScrollRef}
          onInsetChange={setActionBarInsetPx}
        />
      )}
    </div>
  );
}

function ShellContentTransition() {
  return (
    <AnimatePresence mode="wait">
      <motion.div {...CONTENT_TRANSITION} className="min-h-full">
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

// TODO: Verificar se função é usada em algum lugar, se não for, remover
export function LearningShellSkeleton({
  hasActionBar
}: {
  hasActionBar: boolean;
}) {
  return (
    <div className="relative h-full overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 z-20 h-12 border-b bg-card md:h-14" />

      <div
        className={`absolute inset-x-0 overflow-hidden ${
          hasActionBar
            ? 'top-12 bottom-[72px] md:top-14 md:bottom-20'
            : 'top-12 bottom-0 md:top-14'
        }`}
      >
        <div className="flex h-full min-h-0">
          <div className="hidden w-[240px] shrink-0 border-r bg-card lg:block">
            <div className="h-10 border-b" />
            <div className="space-y-3 p-3">
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
              <div className="ml-3 space-y-2">
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
                <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-8">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="h-7 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="mt-6 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>

      {hasActionBar && (
        <div className="absolute inset-x-0 bottom-0 h-[72px] border-t bg-card md:h-20" />
      )}
    </div>
  );
}
