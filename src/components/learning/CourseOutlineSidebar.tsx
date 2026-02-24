import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CourseInteractiveModule,
  CourseInteractiveLesson,
  ProgressStatus
} from '@/types/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLAPSED_KEY = '@tm:courseOutlineCollapsed';

function getPersistedCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '{}');
  } catch {
    return {};
  }
}

const STATUS_CONFIG: Record<
  ProgressStatus,
  { icon: typeof Circle; color: string }
> = {
  NOT_STARTED: { icon: Circle, color: 'text-muted-foreground' },
  IN_PROGRESS: { icon: Loader2, color: 'text-yellow-500' },
  COMPLETED: { icon: CheckCircle2, color: 'text-green-500' }
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CourseOutlineSidebarProps {
  modules: CourseInteractiveModule[];
  activeLessonId: string | null;
  onSelectLesson: (lessonId: string, moduleId: string) => void;
}

export function CourseOutlineSidebar({
  modules,
  activeLessonId,
  onSelectLesson
}: CourseOutlineSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    getPersistedCollapsed
  );

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  // Auto-expand module containing active lesson
  useEffect(() => {
    if (!activeLessonId) return;
    for (const mod of modules) {
      if (mod.lessons.some((l) => l.id === activeLessonId)) {
        if (collapsed[mod.id]) {
          setCollapsed((prev) => ({ ...prev, [mod.id]: false }));
        }
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonId]);

  const toggleModule = useCallback((moduleId: string) => {
    setCollapsed((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }, []);

  return (
    <nav className="space-y-1" aria-label="Estrutura do curso">
      {modules.map((mod, mi) => {
        const isCollapsed = !!collapsed[mod.id];

        return (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: mi * 0.04 }}
          >
            {/* Module header */}
            <button
              onClick={() => toggleModule(mod.id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-accent/50"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{mod.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {mod.progress.completedLessons}/{mod.progress.totalLessons}
              </span>
            </button>

            {/* Lessons */}
            {!isCollapsed && (
              <div className="ml-5 space-y-0.5 border-l border-border pl-3">
                {mod.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    isActive={lesson.id === activeLessonId}
                    onSelect={() => onSelectLesson(lesson.id, mod.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </nav>
  );
}

// ─── LessonRow ────────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  isActive,
  onSelect
}: {
  lesson: CourseInteractiveLesson;
  isActive: boolean;
  onSelect: () => void;
}) {
  const config = STATUS_CONFIG[lesson.progress.status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition',
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-foreground hover:bg-accent/50'
      )}
    >
      <StatusIcon
        className={cn(
          'h-4 w-4 shrink-0',
          isActive ? 'text-primary' : config.color,
          lesson.progress.status === 'IN_PROGRESS' &&
            !isActive &&
            'animate-spin'
        )}
      />
      <span className="flex-1 truncate">{lesson.title}</span>
      {lesson.progress.percent > 0 && lesson.progress.percent < 100 && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {lesson.progress.percent}%
        </span>
      )}
    </button>
  );
}
