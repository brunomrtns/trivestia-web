import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourseInteractive } from './learning.hooks';
import {
  toLearningOverview,
  toLearningCompletion,
  toLearningLesson,
  toLearningStep,
  toLearningActivity
} from './learning.routes';
import type {
  CourseInteractiveDTO,
  CourseInteractiveModule,
  CourseInteractiveNext
} from '@/types/api';

const EMPTY_MODULES: CourseInteractiveModule[] = [];

interface LearningDataContextValue {
  slug: string;
  courseId: string;
  course: CourseInteractiveDTO['course'] | null;
  modules: CourseInteractiveModule[];
  progress: CourseInteractiveDTO['progress'] | null;
  next: CourseInteractiveNext | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

const LearningDataContext = createContext<LearningDataContextValue | null>(
  null
);

interface LearningDataProviderProps {
  slug: string;
  courseId: string;
  children: ReactNode;
}

export function LearningDataProvider({
  slug,
  courseId,
  children
}: LearningDataProviderProps) {
  const query = useCourseInteractive(slug, courseId);
  const course = query.data?.course ?? null;
  const modules = query.data?.modules ?? EMPTY_MODULES;
  const progress = query.data?.progress ?? null;
  const next = query.data?.next ?? null;
  const error = (query.error as Error | null) ?? null;

  const value = useMemo<LearningDataContextValue>(
    () => ({
      slug,
      courseId,
      course,
      modules,
      progress,
      next,
      isLoading: query.isLoading,
      error,
      refetch: query.refetch
    }),
    [
      course,
      courseId,
      error,
      modules,
      next,
      progress,
      query.isLoading,
      query.refetch,
      slug
    ]
  );

  return (
    <LearningDataContext.Provider value={value}>
      {children}
    </LearningDataContext.Provider>
  );
}

export interface LearningActionBarConfig {
  canGoBack: boolean;
  canGoForward: boolean;
  currentLabel: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
}

type LearningShellMode = 'default' | 'fullscreen';

interface LearningNavContextValue {
  slug: string;
  courseId: string;
  activeLessonId: string | null;
  activeStepId: string | null;
  activeActivityId: string | null;
  isDesktopOutlineVisible: boolean;
  isMobileOutlineOpen: boolean;
  shellMode: LearningShellMode;
  actionBar: LearningActionBarConfig | null;
  setDesktopOutlineVisible: (open: boolean) => void;
  setMobileOutlineOpen: (open: boolean) => void;
  toggleOutline: () => void;
  setShellMode: (mode: LearningShellMode) => void;
  setActionBar: (config: LearningActionBarConfig | null) => void;
  selectLesson: (lessonId: string, stepId?: string) => void;
  selectStep: (lessonId: string, stepId: string) => void;
  startActivity: (lessonId: string, stepId: string, activityId: string) => void;
  exitActivity: (lessonId: string, stepId: string) => void;
  goToOverview: () => void;
  goToCompletion: () => void;
}

const LearningNavContext = createContext<LearningNavContextValue | null>(null);

interface LearningNavProviderProps {
  children: ReactNode;
}

function getInitialOutlineOpen(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(min-width: 1024px)').matches;
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 1023px)').matches;
}

export function LearningNavProvider({ children }: LearningNavProviderProps) {
  const navigate = useNavigate();
  const params = useParams<{
    tenantSlug: string;
    courseId: string;
    lessonId?: string;
    stepId?: string;
    activityId?: string;
  }>();

  const slug = params.tenantSlug ?? '';
  const courseId = params.courseId ?? '';
  const activeLessonId = params.lessonId ?? null;
  const activeStepId = params.stepId ?? null;
  const activeActivityId = params.activityId ?? null;

  const [isDesktopOutlineVisible, setDesktopOutlineVisible] = useState(
    getInitialOutlineOpen
  );
  const [isMobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [shellMode, setShellMode] = useState<LearningShellMode>('default');
  const [actionBar, setActionBar] = useState<LearningActionBarConfig | null>(
    null
  );

  const toggleOutline = useCallback(() => {
    if (isMobileViewport()) {
      setMobileOutlineOpen((open) => !open);
      return;
    }

    setDesktopOutlineVisible((open) => !open);
  }, []);

  const goToOverview = useCallback(() => {
    if (isMobileViewport()) {
      setMobileOutlineOpen(false);
    }
    navigate(toLearningOverview(slug, courseId));
  }, [courseId, navigate, slug]);

  const goToCompletion = useCallback(() => {
    if (isMobileViewport()) {
      setMobileOutlineOpen(false);
    }
    navigate(toLearningCompletion(slug, courseId));
  }, [courseId, navigate, slug]);

  const selectLesson = useCallback(
    (lessonId: string, stepId?: string) => {
      if (isMobileViewport()) {
        setMobileOutlineOpen(false);
      }
      navigate(
        stepId
          ? toLearningStep(slug, courseId, lessonId, stepId)
          : toLearningLesson(slug, courseId, lessonId)
      );
    },
    [courseId, navigate, slug]
  );

  const selectStep = useCallback(
    (lessonId: string, stepId: string) => {
      if (isMobileViewport()) {
        setMobileOutlineOpen(false);
      }
      navigate(toLearningStep(slug, courseId, lessonId, stepId));
    },
    [courseId, navigate, slug]
  );

  const startActivity = useCallback(
    (lessonId: string, stepId: string, activityId: string) => {
      if (isMobileViewport()) {
        setMobileOutlineOpen(false);
      }
      navigate(
        toLearningActivity(slug, courseId, lessonId, stepId, activityId)
      );
    },
    [courseId, navigate, slug]
  );

  const exitActivity = useCallback(
    (lessonId: string, stepId: string) => {
      if (isMobileViewport()) {
        setMobileOutlineOpen(false);
      }
      navigate(toLearningStep(slug, courseId, lessonId, stepId));
    },
    [courseId, navigate, slug]
  );

  const value = useMemo<LearningNavContextValue>(
    () => ({
      slug,
      courseId,
      activeLessonId,
      activeStepId,
      activeActivityId,
      isDesktopOutlineVisible,
      isMobileOutlineOpen,
      shellMode,
      actionBar,
      setDesktopOutlineVisible,
      setMobileOutlineOpen,
      toggleOutline,
      setShellMode,
      setActionBar,
      selectLesson,
      selectStep,
      startActivity,
      exitActivity,
      goToOverview,
      goToCompletion
    }),
    [
      actionBar,
      activeActivityId,
      activeLessonId,
      activeStepId,
      courseId,
      exitActivity,
      goToCompletion,
      goToOverview,
      isDesktopOutlineVisible,
      isMobileOutlineOpen,
      selectLesson,
      selectStep,
      shellMode,
      slug,
      startActivity,
      toggleOutline
    ]
  );

  return (
    <LearningNavContext.Provider value={value}>
      {children}
    </LearningNavContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLearningData(): LearningDataContextValue {
  const context = useContext(LearningDataContext);
  if (!context) {
    throw new Error('useLearningData must be used within LearningDataProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLearningNav(): LearningNavContextValue {
  const context = useContext(LearningNavContext);
  if (!context) {
    throw new Error('useLearningNav must be used within LearningNavProvider');
  }
  return context;
}
