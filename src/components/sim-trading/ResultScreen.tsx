import { Trophy, XCircle, AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SimulationResult,
  ChallengeSubmitResponse,
  PracticeSubmitResponse
} from '@/types/api';

interface ResultScreenProps {
  mode: 'CHALLENGE' | 'PRACTICE';
  result: SimulationResult;
  submitResult?: ChallengeSubmitResponse | PracticeSubmitResponse | null;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ResultScreen({
  mode,
  result,
  submitResult,
  onRetry,
  onGoHome
}: ResultScreenProps) {
  const challengeResult =
    mode === 'CHALLENGE'
      ? (submitResult as ChallengeSubmitResponse | null)
      : null;

  const passed = challengeResult?.passed ?? false;
  const score = challengeResult?.score ?? 0;
  const maxScore = challengeResult?.maxScore ?? 100;
  const tamperDetected = challengeResult?.tamperDetected ?? false;

  const pnl = result.totalPnl;
  const pnlPct = result.totalPnlPercent; // já em %, ex: 5.23

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 text-center">
      {/* Icon */}
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full',
          mode === 'PRACTICE'
            ? 'bg-blue-500/20'
            : passed
              ? 'bg-emerald-500/20'
              : 'bg-red-500/20'
        )}
      >
        {mode === 'PRACTICE' ? (
          <Trophy className="h-8 w-8 text-blue-400" />
        ) : passed ? (
          <Trophy className="h-8 w-8 text-emerald-400" />
        ) : (
          <XCircle className="h-8 w-8 text-red-400" />
        )}
      </div>

      {/* Title */}
      <div>
        <h2 className="text-xl font-bold">
          {mode === 'PRACTICE'
            ? 'Sessão Concluída!'
            : passed
              ? 'Desafio Aprovado!'
              : 'Desafio Não Aprovado'}
        </h2>
        {mode === 'CHALLENGE' && (
          <p className="mt-1 text-sm text-muted-foreground">
            {passed
              ? 'Parabéns! Você atingiu os critérios de aprovação.'
              : 'Continue praticando e tente novamente.'}
          </p>
        )}
      </div>

      {/* Score (CHALLENGE only) */}
      {mode === 'CHALLENGE' && (
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'text-4xl font-bold',
              passed ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {score}/{maxScore}
          </div>
          <div className="text-sm text-muted-foreground">pontos</div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid w-full max-w-sm grid-cols-2 gap-3 rounded-lg border bg-card p-4 text-left">
        {[
          {
            label: 'PnL',
            value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`,
            color: pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
          },
          {
            label: 'Saldo Final',
            value: `$${result.finalBalance.toFixed(2)}`,
            color: 'text-foreground'
          },
          {
            label: 'Trades',
            value: `${result.tradeCount} (${result.winRate.toFixed(0)}% win)`,
            color: 'text-foreground'
          },
          {
            label: 'Max Drawdown',
            value: `${result.maxDrawdownPercent.toFixed(2)}%`,
            color:
              result.maxDrawdownPercent < 10
                ? 'text-emerald-400'
                : 'text-red-400'
          },
          {
            label: 'Sharpe',
            value: result.sharpeRatio.toFixed(2),
            color:
              result.sharpeRatio >= 1
                ? 'text-emerald-400'
                : result.sharpeRatio >= 0
                  ? 'text-yellow-400'
                  : 'text-red-400'
          },
          {
            label: 'Fees',
            value: `$${result.totalFees.toFixed(2)}`,
            color: 'text-orange-400'
          }
        ].map((m) => (
          <div key={m.label}>
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className={cn('text-sm font-mono font-semibold', m.color)}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tamper warning */}
      {tamperDetected && (
        <div className="flex items-center gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs text-orange-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Divergência detectada — resultado calculado pelo servidor
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onRetry && mode === 'CHALLENGE' && !passed && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            Tentar Novamente
          </button>
        )}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            {mode === 'PRACTICE' ? 'Nova Sessão' : 'Voltar'}
          </button>
        )}
      </div>
    </div>
  );
}
