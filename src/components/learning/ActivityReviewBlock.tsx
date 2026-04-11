import { CheckCircle2, Clock, Lock, XCircle } from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import type {
  Activity,
  Answer,
  SubmissionResponse,
  SubmissionResult,
  Question
} from '@/types/api';

interface ActivityReviewBlockProps {
  activity: Activity;
  review: SubmissionResponse | null;
  localResult: SubmissionResult | null;
  answers: Record<string, Answer>;
}

export function ActivityReviewBlock({
  activity,
  review,
  localResult,
  answers
}: ActivityReviewBlockProps) {
  if (!review) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        A revisão detalhada será carregada em instantes.
      </div>
    );
  }

  if (review.reviewPolicy === 'NEVER') {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <Lock className="h-5 w-5 shrink-0" />A revisão desta atividade não está
        disponível.
      </div>
    );
  }

  if (review.reviewPolicy === 'AFTER_DATE' && !review.reviewAllowed) {
    const hasReviewDate = Boolean(review.reviewAvailableAt);

    return (
      <div className="space-y-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 shrink-0 text-yellow-500" />
          Revisão disponível em{' '}
          {hasReviewDate
            ? new Date(review.reviewAvailableAt!).toLocaleString('pt-BR')
            : 'data indisponível no momento'}
          .
        </div>

        {!hasReviewDate && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            Política AFTER_DATE recebida sem reviewAvailableAt. Revisão mantida
            bloqueada por segurança.
          </div>
        )}
      </div>
    );
  }

  if (!review.reviewAllowed) {
    if (review.responses.length > 0) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Revisão bloqueada pela política da atividade. Respostas retornadas
          pelo backend não serão exibidas.
        </div>
      );
    }

    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Revisão da atividade</h2>

      {review.responses.map((response, index) => {
        const feedback = localResult?.results?.find(
          (entry) => entry.questionId === response.questionId
        )?.feedback;

        const reviewQuestion: Question = {
          id: response.questionId,
          statement: response.question.statement,
          imageUrl: response.question.imageUrl ?? null,
          difficulty: 1,
          explanation: response.question.explanation ?? '',
          weight: response.question.weight,
          order: index,
          options: response.question.options.map((option, optionIndex) => ({
            id: option.id,
            text: option.text,
            order: optionIndex
          }))
        };

        return (
          <div
            key={response.questionId}
            className={`rounded-2xl border p-5 shadow-sm ${
              response.isCorrect
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              {response.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                Questão {index + 1} ·{' '}
                {response.isCorrect ? 'Correta' : 'Incorreta'}
              </span>
            </div>

            {feedback ? (
              <QuestionRenderer
                activityType={activity.type}
                question={reviewQuestion}
                value={answers[response.questionId] ?? null}
                onChange={() => {}}
                feedback={feedback}
              />
            ) : (
              <>
                <p className="mb-3 text-sm font-semibold leading-relaxed">
                  {response.question.statement}
                </p>

                {response.question.imageUrl && (
                  <img
                    src={response.question.imageUrl}
                    alt="Imagem da questão"
                    className="mb-3 max-h-48 w-full rounded-xl object-contain bg-muted/30"
                  />
                )}

                {response.question.options.length > 0 && (
                  <div className="space-y-1.5">
                    {response.question.options.map((option) => {
                      const withCorrect = option as typeof option & {
                        isCorrect?: boolean;
                      };

                      return (
                        <div
                          key={option.id}
                          className={`rounded-lg px-3 py-2 text-sm ${
                            withCorrect.isCorrect
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          {option.text}
                        </div>
                      );
                    })}
                  </div>
                )}

                {response.question.explanation && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary/90">
                    <span className="mr-1 font-semibold">Explicação:</span>
                    {response.question.explanation}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
