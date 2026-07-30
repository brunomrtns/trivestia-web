import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Play, RotateCcw } from 'lucide-react';
import type { CourseInteractiveDTO, CourseInteractiveNext } from '@/types/api';
import { TeacherProfileBadge } from '@/components/teacher/TeacherProfileBadge';

interface CourseInteractiveHeaderProps {
  course: CourseInteractiveDTO['course'];
  progress: CourseInteractiveDTO['progress'];
  next: CourseInteractiveNext | null;
  onContinue: () => void;
}

export function CourseInteractiveHeader({
  course,
  progress,
  next,
  onContinue
}: CourseInteractiveHeaderProps) {
  const { t } = useTranslation();
  const isComplete = progress.percent === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold truncate">{course.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
          <TeacherProfileBadge
            teacherProfile={course.teacherProfile}
            label="Seu professor"
            className="mt-3"
          />
        </div>

        <button
          onClick={onContinue}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          {isComplete ? (
            <>
              <RotateCcw className="h-4 w-4" />
              {t('learning.courseInteractive.review')}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {t('learning.courseInteractive.continue')}
            </>
          )}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {t('learning.courseInteractive.lessonsCount', {
              completedLessons: progress.completedLessons,
              totalLessons: progress.totalLessons
            })}
          </span>
          <span className="font-semibold text-foreground">
            {progress.percent}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
