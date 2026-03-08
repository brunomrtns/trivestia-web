import {
  Target,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  ChevronRight,
  Trophy,
  RotateCcw,
  Loader2,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ChallengeBriefingData } from '@/types/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChallengeBriefingScreenProps {
  briefing: ChallengeBriefingData;
  isLoadingScenario?: boolean;
  onStart: () => void;
  onViewResult?: () => void;
  onGoBack?: () => void;
  onOpenHelp?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChallengeBriefingScreen({
  briefing,
  isLoadingScenario,
  onStart,
  onViewResult,
  onGoBack,
  onOpenHelp
}: ChallengeBriefingScreenProps) {
  const { objectives, rules, alreadyPassed, lastAttempt } = briefing;
  const { t } = useTranslation();

  // ─── Já aprovado ────────────────────────────────────────────────────────────

  if (alreadyPassed) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
          <Trophy className="h-10 w-10 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">
            {t('sim.briefing.alreadyPassed.title')}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t('sim.briefing.alreadyPassed.description', {
              score: lastAttempt?.score ?? 0,
              count: lastAttempt?.attemptCount ?? 1
            })}
          </p>
        </div>
        <div className="flex gap-3">
          {onViewResult && (
            <button
              onClick={onViewResult}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Trophy className="h-4 w-4" />
              {t('sim.briefing.alreadyPassed.viewResultButton')}
            </button>
          )}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.actions.back')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Briefing ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t('sim.briefing.badge')}
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight">{briefing.title}</h1>
          {briefing.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {briefing.description}
            </p>
          )}
        </div>
        {onOpenHelp && (
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {t('sim.briefing.helpButton')}
          </button>
        )}
      </div>

      {/* Tentativa anterior */}
      {lastAttempt && !lastAttempt.passed && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          <RotateCcw className="h-4 w-4 shrink-0 text-yellow-500" />
          <div className="text-sm">
            <span className="font-medium text-yellow-400">
              {t('sim.briefing.prevAttempt.label')}
            </span>{' '}
            <span className="text-muted-foreground">
              {t('sim.briefing.prevAttempt.value', {
                score: lastAttempt.score,
                attempt: lastAttempt.attemptCount
              })}
            </span>
          </div>
        </div>
      )}

      {/* Objetivos */}
      {objectives && (
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest">
              {t('sim.briefing.objectives.title')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ObjectiveCard
              icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
              label={t('sim.briefing.objectives.profitTarget')}
              value={`+${objectives.minPnlPercent}% PnL`}
              description={t('sim.briefing.objectives.profitDesc')}
              variant="success"
            />
            <ObjectiveCard
              icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
              label={t('sim.briefing.objectives.maxDrawdown')}
              value={`${objectives.maxDrawdownPercent}%`}
              description={t('sim.briefing.objectives.drawdownDesc')}
              variant="danger"
            />
            <ObjectiveCard
              icon={<BarChart3 className="h-5 w-5 text-blue-400" />}
              label={t('sim.briefing.objectives.minTrades')}
              value={`${objectives.minTradeCount} trades`}
              description={t('sim.briefing.objectives.minTradesDesc')}
              variant="info"
            />
          </div>
        </section>
      )}

      {/* Regras */}
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-widest">
            Regras do Desafio
          </h2>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <RuleItem
            icon={<DollarSign className="h-3.5 w-3.5" />}
            label={t('sim.briefing.rules.initialBalance')}
            value={`$${rules.initialBalance.toLocaleString('pt-BR')}`}
          />
          <RuleItem
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            label={t('sim.briefing.rules.maxEvents')}
            value={`${rules.maxEvents} ordens`}
          />
          <RuleItem
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label={t('sim.briefing.rules.maxLeverage')}
            value={`${rules.maxLeverage}×`}
          />
          <RuleItem
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            label={t('sim.briefing.rules.feeBps')}
            value={`${rules.feeBps} bps`}
          />
          {rules.allowShort && (
            <RuleItem
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label={t('sim.briefing.rules.shortSelling')}
              value={t('sim.briefing.rules.allowed')}
            />
          )}
        </div>
      </section>

      {/* Como funciona */}
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-widest">
            Como Funciona
          </h2>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          {[
            t('sim.briefing.howItWorks.step1'),
            t('sim.briefing.howItWorks.step2'),
            t('sim.briefing.howItWorks.step3'),
            t('sim.briefing.howItWorks.step4'),
            t('sim.briefing.howItWorks.step5'),
            t('sim.briefing.howItWorks.step6')
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.actions.back')}
          </button>
        )}

        <button
          onClick={onStart}
          disabled={isLoadingScenario}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 sm:flex-none"
        >
          {isLoadingScenario ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('sim.briefing.loadingScenario')}
            </>
          ) : (
            <>
              {t('sim.briefing.startButton')}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ObjectiveCard({
  icon,
  label,
  value,
  description,
  variant
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  variant: 'success' | 'danger' | 'info';
}) {
  const borderColor = {
    success: 'border-emerald-500/20',
    danger: 'border-red-500/20',
    info: 'border-blue-500/20'
  }[variant];

  return (
    <div
      className={cn('flex flex-col gap-2 rounded-lg border p-4', borderColor)}
    >
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold">{value}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  );
}

function RuleItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
