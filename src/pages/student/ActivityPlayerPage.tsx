import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { progressEndpoints } from '@/services/endpoints/progress.endpoints';
import { simulationEndpoints } from '@/services/endpoints/simulation.endpoints';
import { QuestionRenderer } from '@/components/learning/QuestionRenderer';
import { SimTradingTerminal } from '@/components/sim-trading/SimTradingTerminal';
import { ChallengeBriefingScreen } from '@/components/sim-trading/ChallengeBriefingScreen';
import { HelpDrawer } from '@/components/sim-trading/HelpDrawer';
import { useTutorialProgress } from '@/components/sim-trading/useTutorialProgress';
import { formatPercentage } from '@/lib/utils';
import type { Answer, SubmissionResult } from '@/types/api';

export default function ActivityPlayerPage() {
  const { lessonId, activityId, tenantSlug } = useParams<{
    lessonId?: string;
    activityId: string;
    tenantSlug: string;
  }>();
  const slug = tenantSlug ?? '';
  const navigate = useNavigate();
  const { t } = useTranslation();

  const qc = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // GET /lessons/:lessonId/activities/:activityId — Bearer ANY
  // staleTime:0 garante que novas questões criadas pelo admin aparecem sem F5
  const {
    data: activity,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ['activity', slug, lessonId, activityId],
    queryFn: () => learningEndpoints.getActivity(slug, lessonId!, activityId!),
    enabled: !!lessonId && !!activityId,
    staleTime: 0
  });

  // POST /submissions — Bearer ANY
  const submitMutation = useMutation({
    mutationFn: (data: {
      activityId: string;
      responses: { questionId: string; answer: Answer }[];
    }) => progressEndpoints.submit(slug, data),
    onSuccess: (data) => {
      setResult(data);
      setIsRetrying(false);
      // Força reload da revisão após submissão
      qc.invalidateQueries({
        queryKey: ['submission-review', slug, activityId]
      });
      toast.success(t('app.activity.toast.submitSuccess'));
    },
    onError: () => {
      toast.error(t('app.activity.toast.submitError'));
    }
  });

  // GET /submissions/:activityId — sempre carregado para detectar submissão existente
  // 404 = sem submissão ainda → retorna null (não é erro)
  const { data: submissionReview, isLoading: loadingReview } = useQuery({
    queryKey: ['submission-review', slug, activityId],
    queryFn: async () => {
      try {
        return await progressEndpoints.getSubmission(slug, activityId!);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) return null; // sem submissão ainda
        throw err;
      }
    },
    enabled: !!activityId,
    staleTime: 0,
    retry: false
  });

  // Verifica se o prazo do curso expirou (bloqueia submissão, mas não exibe)
  const { data: unlock } = useQuery({
    queryKey: ['lesson-unlock', slug, lessonId],
    queryFn: () => progressEndpoints.isLessonUnlocked(slug, lessonId!),
    enabled: !!lessonId,
    staleTime: 60 * 1000
  });
  const isCourseExpired = unlock?.reason === 'COURSE_EXPIRED';

  if (!lessonId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold">Nao foi possivel abrir a atividade</p>
        <p className="text-sm text-muted-foreground">
          Esta rota legada nao possui contexto de aula para carregar a atividade.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/t/${slug}/app/dashboard`)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Ir para dashboard
        </button>
      </div>
    );
  }

  // Aguarda: carregamento da atividade E verificação de submissão existente
  // Inclui caso: refetch em background com 0 questões no cache (evita currentQuestion=undefined)
  if (
    isLoading ||
    !activity ||
    (!result && loadingReview) ||
    (isFetching && activity.questions.length === 0)
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Desafio de Trading: briefing → terminal ──────────────────────────────────
  if (activity.type === 'SIM_TRADING_CHALLENGE') {
      return (
      <SimTradingChallengeFlow
        slug={slug}
        activityId={activityId!}
        onGoBack={() => {
          if (lessonId) {
            navigate(`/t/${slug}/app/lessons/${lessonId}`);
          } else {
            navigate(`/t/${slug}/app/dashboard`);
          }
        }}
      />
    );
  }

  const questions = activity.questions;
  const totalQuestions = questions.length;

  // Atividade sem questões
  if (totalQuestions === 0 && !isFetching) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold">{t('app.activity.empty.title')}</p>
        <p className="text-sm text-muted-foreground">
          {t('app.activity.empty.subtitle')}
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // Guard: questão atual inexistente (nunca deveria chegar aqui, mas previne crash)
  if (!currentQuestion) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tela de resultado: exibe se acabou de submeter OU se já tinha submissão anterior
  // submissionReview=null significa sem submissão; submissionReview=object significa já submeteu
  if (!isRetrying && (result !== null || submissionReview != null)) {
    const score = result?.score ?? submissionReview?.score ?? 0;
    const maxScore = result?.maxScore ?? submissionReview?.maxScore ?? 1;
    const pct =
      result?.percentage ??
      (maxScore > 0 ? Math.round((score / maxScore) * 100) : 0);
    const passed = pct >= 60;

    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
        {/* Score header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center"
        >
          <div
            className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${passed ? 'bg-green-100' : 'bg-yellow-100'}`}
          >
            <Trophy
              className={`h-12 w-12 ${passed ? 'text-green-500' : 'text-yellow-500'}`}
            />
          </div>
          <h1 className="mb-2 text-4xl font-extrabold">
            {formatPercentage(pct)}
          </h1>
          <p className="mb-1 text-lg font-semibold">
            {passed
              ? t('app.activity.result.passed')
              : t('app.activity.result.failed')}
          </p>
          <p className="mb-8 text-muted-foreground">
            {t('app.activity.result.scoreLabel', { score, maxScore })}
          </p>
        </motion.div>

        {/* ─── Revisão condicional das questões ─────────────────────────────── */}
        {loadingReview && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {submissionReview && !loadingReview && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">
              {t('app.activity.result.reviewTitle')}
            </h2>

            {/* Política: NEVER */}
            {submissionReview.reviewPolicy === 'NEVER' && (
              <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                <Lock className="h-5 w-5 shrink-0" />
                {t('app.activity.result.policyNever')}
              </div>
            )}

            {/* Política: AFTER_DATE ainda bloqueada */}
            {submissionReview.reviewPolicy === 'AFTER_DATE' &&
              !submissionReview.reviewAllowed && (
                <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                  <Clock className="h-5 w-5 shrink-0 text-yellow-500" />
                  <span>
                    {t('app.activity.result.policyAfterDate', {
                      date: submissionReview.reviewAvailableAt
                        ? new Date(
                            submissionReview.reviewAvailableAt
                          ).toLocaleString('pt-BR')
                        : t('app.activity.result.policyDateFallback')
                    })}
                  </span>
                </div>
              )}

            {/* Revisão permitida: questão por questão */}
            {submissionReview.reviewAllowed &&
              submissionReview.responses.map((r, idx) => {
                const feedbackEntry = result?.results?.find(
                  (x) => x.questionId === r.questionId
                );
                return (
                  <div
                    key={r.questionId}
                    className={`rounded-2xl border p-5 shadow-sm ${
                      r.isCorrect
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-red-500/30 bg-red-500/5'
                    }`}
                  >
                    {/* Cabeçalho com resultado */}
                    <div className="mb-3 flex items-center gap-2">
                      {r.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-xs font-semibold text-muted-foreground">
                        {t('app.activity.result.questionN', { n: idx + 1 })} ·{' '}
                        {r.isCorrect
                          ? t('app.activity.result.correct')
                          : t('app.activity.result.incorrect')}{' '}
                        ·{' '}
                        {t('app.activity.result.questionScore', {
                          earned: r.earnedScore,
                          weight: r.question.weight
                        })}
                      </span>
                    </div>

                    {/* Enunciado */}
                    <p className="mb-3 text-sm font-semibold leading-relaxed">
                      {r.question.statement}
                    </p>

                    {/* Imagem do enunciado */}
                    {r.question.imageUrl && (
                      <img
                        src={r.question.imageUrl}
                        alt={t('app.activity.result.questionImageAlt')}
                        className="mb-3 max-h-48 w-full rounded-xl object-contain bg-muted/30"
                      />
                    )}

                    {/* Opções com gabarito (isCorrect presente quando review liberado) */}
                    {r.question.options.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        {r.question.options.map((opt) => {
                          const withCorrect = opt as typeof opt & {
                            isCorrect?: boolean;
                          };
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                                withCorrect.isCorrect
                                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                  : 'bg-muted/30 text-muted-foreground'
                              }`}
                            >
                              <span className="mt-0.5 h-3 w-3 shrink-0">
                                {withCorrect.isCorrect ? '✓' : '–'}
                              </span>
                              {opt.text}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explicação */}
                    {r.question.explanation && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary/90">
                        <span className="mr-1 font-semibold">
                          {t('app.activity.result.explanationLabel')}
                        </span>
                        {r.question.explanation}
                      </div>
                    )}

                    {/* Feedback de atividades especiais (ChartMarkup, RiskCalc) */}
                    {feedbackEntry?.feedback && (
                      <QuestionRenderer
                        activityType={activity.type}
                        question={{
                          id: r.questionId,
                          statement: r.question.statement,
                          difficulty: 1,
                          explanation: '',
                          weight: r.question.weight,
                          order: idx,
                          options: []
                        }}
                        value={answers[r.questionId] ?? null}
                        onChange={() => {}}
                        feedback={feedbackEntry.feedback}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3 pb-8">
          <button
            onClick={() => {
              setIsRetrying(true);
              setResult(null);
              setAnswers({});
              setCurrentIndex(0);
            }}
            className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            {t('app.activity.result.retry')}
          </button>
          <button
            onClick={() => navigate(`/t/${slug}/app/dashboard`)}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {t('app.activity.result.goToDashboard')}
          </button>
        </div>
      </div>
    </div>
    );
  }

  const handleAnswer = (answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleSubmit = () => {
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      toast.warning(t('app.activity.toast.incomplete'));
      return;
    }
    submitMutation.mutate({
      activityId: activity.id,
      responses: questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id]
      }))
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>{t(`common.activityTypes.${activity.type}`, { defaultValue: activity.type })}</span>
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

      {/* Banner prazo encerrado */}
      {isCourseExpired && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {t('app.activity.expiredBanner')}
        </div>
      )}

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-accent disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('common.pagination.previous')}
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            disabled={!answers[currentQuestion.id]}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {t('app.lesson.nav.next')}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || isCourseExpired}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {submitMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {t('app.activity.nav.submit')}
          </button>
        )}
      </div>
    </div>
    </div>
  );
}

// ─── Sim Trading Challenge Flow (Briefing → Terminal) ─────────────────────────

type ChallengePhase = 'BRIEFING' | 'TERMINAL';

function SimTradingChallengeFlow({
  slug,
  activityId,
  onGoBack
}: {
  slug: string;
  activityId: string;
  onGoBack: () => void;
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<ChallengePhase>('BRIEFING');
  const [helpOpen, setHelpOpen] = useState(false);
  const tutorial = useTutorialProgress();

  // Buscar briefing
  const {
    data: briefing,
    isLoading,
    error
  } = useQuery({
    queryKey: ['challenge-briefing', slug, activityId],
    queryFn: () => simulationEndpoints.getChallengeBriefing(slug, activityId),
    retry: false
  });

  // Loading
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Erro (incluindo 409 já aprovado tratado no briefing)
  if (error && !briefing) {
    const errMsg =
      (error as { response?: { status?: number } })?.response?.status === 409
        ? t('app.activity.challenge.alreadyApproved')
        : t('app.activity.challenge.loadError');

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Trophy className="h-12 w-12 text-emerald-400" />
        <h2 className="text-lg font-semibold">{errMsg}</h2>
        <button
          onClick={onGoBack}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          {t('common.actions.back')}
        </button>
      </div>
    );
  }

  if (!briefing) return null;

  if (phase === 'BRIEFING') {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <ChallengeBriefingScreen
          briefing={briefing}
          onStart={() => setPhase('TERMINAL')}
          onGoBack={onGoBack}
          onOpenHelp={() => setHelpOpen(true)}
        />
        <HelpDrawer
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          onRestartTutorial={tutorial.restart}
        />
      </div>
    );
  }

  // PHASE: TERMINAL
  return (
    <SimTradingTerminal
      slug={slug}
      mode="CHALLENGE"
      activityId={activityId}
      onComplete={onGoBack}
      onOpenHelp={() => setHelpOpen(true)}
      showOnboarding={!tutorial.completed}
      allowSymbolSwitching={briefing?.allowSymbolSwitching ?? false}
      supportedSymbols={briefing?.supportedSymbols ?? []}
      onSymbolSwitch={
        briefing?.allowSymbolSwitching
          ? async (symbol: string) => {
              const result = await simulationEndpoints.getChallengeScenario(
                slug,
                activityId,
                symbol
              );
              return {
                candles: result.candles,
                executionConfig: result.executionConfig,
                scenarioToken: result.scenarioToken,
                scoringConfig: result.scoringConfig
              };
            }
          : undefined
      }
    />
  );
}
