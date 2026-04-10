import { Trophy } from 'lucide-react';
import { formatPercentage } from '@/lib/utils';
import type {
  Activity,
  Answer,
  SubmissionResponse,
  SubmissionResult
} from '@/types/api';
import { ActivityReviewBlock } from './ActivityReviewBlock';

interface ActivityResultProps {
  activity: Activity;
  review: SubmissionResponse | null;
  localResult: SubmissionResult | null;
  answers: Record<string, Answer>;
}

export function ActivityResult({
  activity,
  review,
  localResult,
  answers
}: ActivityResultProps) {
  const score = localResult?.score ?? review?.score ?? 0;
  const maxScore = localResult?.maxScore ?? review?.maxScore ?? 1;
  const percentage =
    localResult?.percentage ??
    (maxScore > 0 ? Math.round((score / maxScore) * 100) : 0);
  const passed = percentage >= 60;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${
            passed ? 'bg-green-100' : 'bg-red-50'
          }`}
        >
          <Trophy
            className={`h-12 w-12 ${
              passed ? 'text-green-500' : 'text-red-500'
            }`}
          />
        </div>
        <h1 className="mb-2 text-4xl font-extrabold">
          {formatPercentage(percentage)}
        </h1>
        <p className="mb-1 text-lg font-semibold">
          {passed ? 'Atividade concluída' : 'Tente novamente'}
        </p>
        <p className="text-muted-foreground">
          {score} de {maxScore} pontos
        </p>
      </div>

      <ActivityReviewBlock
        activity={activity}
        review={review}
        localResult={localResult}
        answers={answers}
      />
    </div>
  );
}
