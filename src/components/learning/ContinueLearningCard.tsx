import { ArrowRight, BookOpen, CheckCircle2, PlayCircle } from 'lucide-react';
import {
  useLearningData,
  useLearningNav
} from '@/features/learning/learning.context';
import {
  buildLearningNextUrl,
  isLearningCourseCompleted
} from '@/features/learning/learning.utils';

export function ContinueLearningCard() {
  const { slug, courseId, next, progress } = useLearningData();
  const {
    selectLesson,
    selectStep,
    startActivity,
    goToCompletion,
    goToOverview
  } = useLearningNav();

  const isCompleted = isLearningCourseCompleted(progress, next);
  const nextUrl = buildLearningNextUrl(slug, courseId, next);

  if (isCompleted) {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-emerald-100 p-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Curso concluído</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Você finalizou todo o fluxo. Veja o resumo final do curso.
            </p>
          </div>
          <button
            type="button"
            onClick={goToCompletion}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Ver conclusão
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!next || !nextUrl) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Continuidade indisponível</p>
            <p className="mt-1 text-sm text-amber-800">
              Não foi possível resolver o próximo passo automaticamente. Use o
              overview para continuar com segurança.
            </p>
          </div>
          <button
            type="button"
            onClick={goToOverview}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900"
          >
            Ir para overview
          </button>
        </div>
      </div>
    );
  }

  const label =
    next.kind === 'ACTIVITY'
      ? 'Continuar na atividade'
      : 'Continuar do ponto atual';

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
          <PlayCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Continue de onde parou</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Próximo destino: {next.kind === 'ACTIVITY' ? 'atividade' : 'step'}{' '}
            da aula atual.
          </p>
        </div>
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
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          {label}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
