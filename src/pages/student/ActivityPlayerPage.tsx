import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Loader2, Trophy, RotateCcw } from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { progressEndpoints } from '@/services/endpoints/progress.endpoints';
import { QuestionRenderer } from '@/components/learning/QuestionRenderer';
import { getActivityTypeLabel, formatPercentage } from '@/lib/utils';
import type { Answer, SubmissionResult } from '@/types/api';

export default function ActivityPlayerPage() {
  const { lessonId, activityId } = useParams<{ lessonId: string; activityId: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);

  // GET /lessons/:lessonId/activities/:activityId — Bearer ANY
  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', lessonId, activityId],
    queryFn: () => learningEndpoints.getActivity(lessonId!, activityId!),
    enabled: !!lessonId && !!activityId,
  });

  // POST /submissions — Bearer ANY
  const submitMutation = useMutation({
    mutationFn: progressEndpoints.submit,
    onSuccess: (data) => {
      setResult(data);
      toast.success('Atividade concluída!');
    },
    onError: () => {
      toast.error('Erro ao enviar respostas. Tente novamente.');
    },
  });

  if (isLoading || !activity) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const questions = activity.questions;
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // Tela de resultado
  if (result) {
    const pct = result.percentage ?? Math.round((result.score / result.maxScore) * 100);
    const passed = pct >= 60;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center text-center"
      >
        <div className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${passed ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <Trophy className={`h-12 w-12 ${passed ? 'text-green-500' : 'text-yellow-500'}`} />
        </div>
        <h1 className="mb-2 text-4xl font-extrabold">{formatPercentage(pct)}</h1>
        <p className="mb-1 text-lg font-semibold">
          {passed ? 'Parabéns! Você passou.' : 'Continue praticando!'}
        </p>
        <p className="mb-8 text-muted-foreground">
          {result.score} de {result.maxScore} pontos
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setResult(null);
              setAnswers({});
              setCurrentIndex(0);
            }}
            className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            Tentar novamente
          </button>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Ir ao Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  const handleAnswer = (answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleSubmit = () => {
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      toast.warning('Responda todas as questões antes de enviar.');
      return;
    }
    submitMutation.mutate({
      activityId: activity.id,
      responses: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] })),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>{getActivityTypeLabel(activity.type)}</span>
          <span>
            {currentIndex + 1}/{totalQuestions}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <h1 className="mt-3 text-xl font-bold">{activity.title}</h1>
      </div>

      {/* Questão */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-6 shadow-sm"
        >
          <p className="mb-6 text-base font-semibold leading-relaxed">
            {currentQuestion.statement}
          </p>
          <QuestionRenderer
            activityType={activity.type}
            question={currentQuestion}
            value={answers[currentQuestion.id] ?? null}
            onChange={handleAnswer}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-accent disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            disabled={!answers[currentQuestion.id]}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar atividade
          </button>
        )}
      </div>
    </div>
  );
}
