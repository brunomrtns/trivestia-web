import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, Home, RotateCcw } from 'lucide-react';
import { useLearningData, useLearningNav } from '@/features/learning/learning.context';
import {
  buildLearningNextUrl,
  isLearningCourseCompleted
} from '@/features/learning/learning.utils';
import { toDashboard } from '@/features/learning/learning.routes';

export function CourseCompletionCard() {
  const { slug, courseId, course, progress, next } = useLearningData();
  const {
    goToOverview,
    goToCompletion,
    selectLesson,
    selectStep,
    startActivity,
    setActionBar,
    setShellMode
  } = useLearningNav();

  useEffect(() => {
    setShellMode('default');
    setActionBar(null);
  }, [setActionBar, setShellMode]);

  const isCompleted = isLearningCourseCompleted(progress, next);
  const nextUrl = buildLearningNextUrl(slug, courseId, next);

  if (!isCompleted) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-bold text-amber-900">Conclusão ainda indisponível</h1>
        <p className="mt-2 text-sm text-amber-800">
          O curso ainda possui etapas pendentes. Continue do ponto atual para concluir.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {next && nextUrl ? (
            <button
              type="button"
              onClick={() => {
                if (next.kind === 'ACTIVITY' && next.stepId && next.activityId) {
                  startActivity(next.lessonId, next.stepId, next.activityId);
                  return;
                }

                if (next.stepId) {
                  selectStep(next.lessonId, next.stepId);
                  return;
                }

                selectLesson(next.lessonId);
              }}
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Continuar aprendizado
            </button>
          ) : (
            <button
              type="button"
              onClick={goToOverview}
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Ir para overview
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Curso concluído com sucesso</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {course?.title ?? 'Curso'} foi finalizado. Você pode revisar o conteúdo quando quiser.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={goToCompletion}
          className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-accent"
        >
          Atualizar resumo
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label="Progresso"
          value={`${progress?.percent ?? 0}%`}
        />
        <SummaryCard
          icon={<BookOpen className="h-4 w-4 text-primary" />}
          label="Aulas concluídas"
          value={`${progress?.completedLessons ?? 0}/${progress?.totalLessons ?? 0}`}
        />
        <SummaryCard
          icon={<Award className="h-4 w-4 text-amber-600" />}
          label="Status"
          value="Finalizado"
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          to={toDashboard(slug)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Home className="h-4 w-4" />
          Voltar ao dashboard
        </Link>

        <button
          type="button"
          onClick={goToOverview}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" />
          Revisar conteúdo
        </button>
      </div>
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

export default CourseCompletionCard;
