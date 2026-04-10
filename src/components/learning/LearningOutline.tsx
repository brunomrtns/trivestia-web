import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Lock,
  PlayCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLearningData, useLearningNav } from '@/features/learning/learning.context';
import { useBatchLessonUnlock } from '@/features/learning/learning.hooks';

const COLLAPSED_KEY = '@tm:learningOutlineCollapsed';

function getInitialCollapsedState(storageKey: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<
      string,
      boolean
    >;
  } catch {
    return {};
  }
}

export default function LearningOutline() {
  const { modules, slug, courseId } = useLearningData();
  const {
    activeLessonId,
    isDesktopOutlineVisible,
    isMobileOutlineOpen,
    setMobileOutlineOpen,
    selectLesson
  } = useLearningNav();
  const collapsedStorageKey = `${COLLAPSED_KEY}:${slug}:${courseId}`;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    () => getInitialCollapsedState(collapsedStorageKey)
  );

  const allLessonIds = useMemo(
    () => modules.flatMap((m) => m.lessons.map((l) => l.id)),
    [modules]
  );

  const unlockMap = useBatchLessonUnlock(slug, allLessonIds);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(collapsedStorageKey, JSON.stringify(collapsed));
  }, [collapsed, collapsedStorageKey]);

  useEffect(() => {
    setCollapsed(getInitialCollapsedState(collapsedStorageKey));
  }, [collapsedStorageKey]);

  const activeModuleId = useMemo(() => {
    for (const module of modules) {
      if (module.lessons.some((lesson) => lesson.id === activeLessonId)) {
        return module.id;
      }
    }
    return null;
  }, [activeLessonId, modules]);

  useEffect(() => {
    if (!activeModuleId) return;
    if (collapsed[activeModuleId]) {
      setCollapsed((previous) => ({ ...previous, [activeModuleId]: false }));
    }
  }, [activeModuleId, collapsed]);

  const toggleModule = (moduleId: string) => {
    setCollapsed((previous) => ({ ...previous, [moduleId]: !previous[moduleId] }));
  };

  return (
    <>
      <aside
        className={cn(
          'hidden h-full w-[240px] shrink-0 border-r bg-card lg:block',
          !isDesktopOutlineVisible && 'lg:hidden'
        )}
      >
        <div className="flex h-10 items-center border-b px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estrutura do curso
          </span>
        </div>
        <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
          <OutlineContent
            activeLessonId={activeLessonId}
            collapsed={collapsed}
            modules={modules}
            unlockMap={unlockMap}
            onLessonSelect={selectLesson}
            onToggleModule={toggleModule}
          />
        </div>
      </aside>

      {isMobileOutlineOpen && (
        <div
          className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOutlineOpen(false)}
        />
      )}

      <aside
        className={cn(
          'absolute inset-y-12 left-0 z-50 w-[88%] max-w-xs border-r bg-card shadow-xl transition-transform duration-200 ease-out md:inset-y-14 lg:hidden',
          isMobileOutlineOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-12 items-center justify-between border-b px-4">
          <span className="text-sm font-semibold">Estrutura do curso</span>
          <button
            type="button"
            onClick={() => setMobileOutlineOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[calc(100%-3rem)] overflow-y-auto">
          <OutlineContent
            activeLessonId={activeLessonId}
            collapsed={collapsed}
            modules={modules}
            unlockMap={unlockMap}
            onLessonSelect={(lessonId) => {
              selectLesson(lessonId);
            }}
            onToggleModule={toggleModule}
          />
        </div>
      </aside>
    </>
  );
}

interface OutlineContentProps {
  modules: ReturnType<typeof useLearningData>['modules'];
  collapsed: Record<string, boolean>;
  activeLessonId: string | null;
  unlockMap: Map<string, boolean>;
  onLessonSelect: (lessonId: string, stepId?: string | undefined) => void;
  onToggleModule: (moduleId: string) => void;
}

function OutlineContent({
  modules,
  collapsed,
  activeLessonId,
  unlockMap,
  onLessonSelect,
  onToggleModule
}: OutlineContentProps) {
  if (!modules.length) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <CircleDashed className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma aula no curso.</p>
      </div>
    );
  }

  return (
    <nav className="py-2" aria-label="Estrutura do curso">
      {modules.map((module, moduleIndex) => {
        const isCollapsed = Boolean(collapsed[module.id]);
        const isActiveModule = module.lessons.some(
          (lesson) => lesson.id === activeLessonId
        );

        return (
          <div key={module.id} className={cn(moduleIndex > 0 && 'mt-1')}>
            <button
              type="button"
              onClick={() => onToggleModule(module.id)}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors',
                isActiveModule && !isCollapsed
                  ? 'bg-accent/50'
                  : 'hover:bg-accent/30'
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 truncate text-sm font-semibold">
                {module.title}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {module.progress.percent}%
              </span>
            </button>

            {!isCollapsed && (
              <>
                <div className="mx-4 mb-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-500"
                    style={{ width: `${module.progress.percent}%` }}
                  />
                </div>

                <div className="pb-1">
                  {module.lessons.map((lesson) => {
                    const isLocked = unlockMap.has(lesson.id)
                      ? !unlockMap.get(lesson.id)
                      : false;

                    return (
                      <OutlineLessonRow
                        key={lesson.id}
                        lessonTitle={lesson.title}
                        isCompleted={lesson.progress.status === 'COMPLETED'}
                        isActive={lesson.id === activeLessonId}
                        percent={lesson.progress.percent}
                        isLocked={isLocked}
                        onSelect={() => onLessonSelect(lesson.id)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}

interface OutlineLessonRowProps {
  lessonTitle: string;
  isCompleted: boolean;
  isActive: boolean;
  percent: number;
  isLocked: boolean;
  onSelect: () => void;
}

function OutlineLessonRow({
  lessonTitle,
  isCompleted,
  isActive,
  percent,
  isLocked,
  onSelect
}: OutlineLessonRowProps) {
  const rowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isActive]);

  return (
    <button
      ref={rowRef}
      type="button"
      onClick={onSelect}
      disabled={isLocked}
      className={cn(
        'relative flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
        isActive
          ? 'bg-primary/8 text-primary font-medium'
          : isLocked
            ? 'cursor-not-allowed text-muted-foreground/60'
            : 'text-foreground/80 hover:bg-accent/40 hover:text-foreground'
      )}
    >
      {isActive && (
        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-primary" />
      )}

      <div className="flex shrink-0 items-center justify-center">
        {isLocked ? (
          <Lock className="h-4 w-4 text-muted-foreground/50" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : isActive ? (
          <PlayCircle className="h-4 w-4 text-primary" />
        ) : (
          <div className="relative flex h-4 w-4 items-center justify-center">
            <CircleDashed className="h-4 w-4 text-muted-foreground/30" />
            {percent > 0 && (
              <span className="absolute h-1 w-1 rounded-full bg-primary/40" />
            )}
          </div>
        )}
      </div>

      <span className="flex-1 truncate">{lessonTitle}</span>

      {!isLocked && !isCompleted && percent > 0 && (
        <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground/70">
          {percent}%
        </span>
      )}
    </button>
  );
}
