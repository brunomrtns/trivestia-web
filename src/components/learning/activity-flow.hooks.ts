import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type {
  Answer,
  Question,
  SubmissionResult,
  SubmitActivityRequest
} from '@/types/api';
import type { LearningActionBarConfig } from '@/features/learning/learning.context';

interface UseActivitySessionOptions {
  activityId: string;
  questions: Question[];
}

interface UseActivitySessionResult {
  currentIndex: number;
  currentQuestion: Question | null;
  answers: Record<string, Answer>;
  localResult: SubmissionResult | null;
  isRetrying: boolean;
  hasResult: boolean;
  setAnswer: (questionId: string, answer: Answer) => void;
  goPrevious: () => void;
  goNext: () => void;
  resetSession: () => void;
  setLocalResult: (result: SubmissionResult | null) => void;
}

export function useActivitySession({
  activityId,
  questions
}: UseActivitySessionOptions): UseActivitySessionResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [localResult, setLocalResult] = useState<SubmissionResult | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const questionIds = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);

  const sanitizeAnswers = useCallback(
    (input: Record<string, Answer>): Record<string, Answer> => {
      const next: Record<string, Answer> = {};
      for (const [questionId, answer] of Object.entries(input)) {
        if (questionIds.has(questionId)) {
          next[questionId] = answer;
        }
      }
      return next;
    },
    [questionIds]
  );

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setLocalResult(null);
    setIsRetrying(true);
  }, []);

  useEffect(() => {
    resetSession();
    setIsRetrying(false);
  }, [activityId, resetSession]);

  useEffect(() => {
    setCurrentIndex((index) => {
      if (questions.length === 0) return 0;
      return Math.min(Math.max(index, 0), questions.length - 1);
    });

    setAnswers((previous) => sanitizeAnswers(previous));
  }, [questions.length, sanitizeAnswers]);

  const currentQuestion = questions[currentIndex] ?? null;

  const setAnswer = useCallback((questionId: string, answer: Answer) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer
    }));
  }, []);

  const setLocalResultSafely = useCallback((result: SubmissionResult | null) => {
    setLocalResult(result);
    setIsRetrying(false);
  }, []);

  const goPrevious = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((index) => Math.min(index + 1, Math.max(questions.length - 1, 0)));
  }, [questions.length]);

  return {
    currentIndex,
    currentQuestion,
    answers,
    localResult,
    isRetrying,
    hasResult: Boolean(localResult),
    setAnswer,
    goPrevious,
    goNext,
    resetSession,
    setLocalResult: setLocalResultSafely
  };
}

interface UseActivityFlowIntegrationOptions {
  activityId: string;
  questions: Question[];
  answers: Record<string, Answer>;
  currentIndex: number;
  currentQuestion: Question | null;
  hasResult: boolean;
  isSubmitting: boolean;
  hasSubmitError: boolean;
  isCourseExpired: boolean;
  nextStepLabel: string;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  onExitToLesson: () => void;
  onExitForward: () => void;
  onSubmit: (payload: SubmitActivityRequest) => void;
}

interface UseActivityFlowIntegrationResult {
  actionBarConfig: LearningActionBarConfig | null;
  submitIfAllowed: () => void;
}

export function useActivityFlowIntegration({
  activityId,
  questions,
  answers,
  currentIndex,
  currentQuestion,
  hasResult,
  isSubmitting,
  hasSubmitError,
  isCourseExpired,
  nextStepLabel,
  onPreviousQuestion,
  onNextQuestion,
  onExitToLesson,
  onExitForward,
  onSubmit
}: UseActivityFlowIntegrationOptions): UseActivityFlowIntegrationResult {
  const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1;
  const currentAnswered = currentQuestion
    ? answers[currentQuestion.id] !== undefined
    : false;
  const allAnswered = questions.every((question) => answers[question.id] !== undefined);

  const submitIfAllowed = useCallback(() => {
    if (questions.length === 0) return;

    if (!allAnswered) {
      toast.warning('Responda todas as questões antes de enviar.');
      return;
    }

    if (isCourseExpired) {
      toast.error('O prazo do curso foi encerrado para novas submissões.');
      return;
    }

    onSubmit({
      activityId,
      responses: questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id]
      }))
    });
  }, [activityId, allAnswered, answers, isCourseExpired, onSubmit, questions]);

  const actionBarConfig = useMemo<LearningActionBarConfig | null>(() => {
    if (hasResult) {
      return {
        canGoBack: true,
        canGoForward: true,
        currentLabel: 'Resultado da atividade',
        nextLabel: nextStepLabel,
        onPrevious: onExitToLesson,
        onNext: onExitForward
      };
    }

    if (!currentQuestion || questions.length === 0) {
      return null;
    }

    if (isSubmitting) {
      return {
        canGoBack: false,
        canGoForward: false,
        currentLabel: 'Enviando respostas...',
        nextLabel: 'Enviando...'
      };
    }

    if (hasSubmitError && isLastQuestion) {
      return {
        canGoBack: currentIndex > 0,
        canGoForward: allAnswered && !isCourseExpired,
        currentLabel: `Falha no envio (${currentIndex + 1}/${questions.length})`,
        nextLabel: 'Tentar novamente',
        onPrevious: currentIndex > 0 ? onPreviousQuestion : undefined,
        onNext: allAnswered && !isCourseExpired ? submitIfAllowed : undefined
      };
    }

    return {
      canGoBack: currentIndex > 0,
      canGoForward: isLastQuestion
        ? allAnswered && !isCourseExpired
        : currentAnswered,
      currentLabel: `Questão ${currentIndex + 1} de ${questions.length}`,
      nextLabel: isLastQuestion ? 'Enviar' : 'Próxima questão',
      onPrevious: currentIndex > 0 ? onPreviousQuestion : undefined,
      onNext: isLastQuestion
        ? submitIfAllowed
        : currentAnswered
          ? onNextQuestion
          : undefined
    };
  }, [
    allAnswered,
    currentAnswered,
    currentIndex,
    currentQuestion,
    hasResult,
    hasSubmitError,
    isCourseExpired,
    isLastQuestion,
    isSubmitting,
    nextStepLabel,
    onExitForward,
    onExitToLesson,
    onNextQuestion,
    onPreviousQuestion,
    questions.length,
    submitIfAllowed
  ]);

  return {
    actionBarConfig,
    submitIfAllowed
  };
}
