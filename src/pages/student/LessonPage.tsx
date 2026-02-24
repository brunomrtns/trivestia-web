import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { getActivityTypeLabel, cn } from '@/lib/utils';
import type { ActivityType } from '@/types/api';

const TYPE_COLORS: Record<ActivityType, string> = {
  MULTIPLE_CHOICE: 'bg-blue-500/10 text-blue-600 border-blue-200',
  MULTIPLE_SELECT: 'bg-purple-500/10 text-purple-600 border-purple-200',
  TRUE_FALSE: 'bg-green-500/10 text-green-600 border-green-200',
  ORDERING: 'bg-orange-500/10 text-orange-600 border-orange-200',
  TEXT_INPUT: 'bg-pink-500/10 text-pink-600 border-pink-200',
  SCENARIO: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
};

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const location = useLocation();

  // Título pode vir via state de navegação (passado pelo CourseDetailPage)
  const lessonTitle: string | undefined = (location.state as { lessonTitle?: string } | null)?.lessonTitle;
  const courseId: string | undefined = (location.state as { courseId?: string } | null)?.courseId;

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', lessonId],
    queryFn: () => learningEndpoints.getActivities(lessonId!),
    enabled: !!lessonId,
  });

  return (
    <div className="container max-w-3xl py-12">
      {/* Breadcrumb / voltar */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        {courseId ? (
          <Link to={`/courses/${courseId}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Voltar ao curso
          </Link>
        ) : (
          <Link to="/courses" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Cursos
          </Link>
        )}
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold">
          {lessonTitle ?? 'Atividades da aula'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Selecione uma atividade abaixo para iniciar.
        </p>
      </div>

      {/* Activities list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/app/lessons/${lessonId}/activities/${activity.id}`}
                className="group flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate group-hover:text-primary transition-colors">
                    {activity.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activity.questions?.length ?? 0} questão(ões)
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium',
                    TYPE_COLORS[activity.type] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {getActivityTypeLabel(activity.type)}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <Zap className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>Nenhuma atividade disponível nesta aula ainda.</p>
        </div>
      )}
    </div>
  );
}
