import { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Percent,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Question,
  RiskCalculatorAnswer,
  RiskCalculatorFeedback,
  RiskCalculatorMetadata
} from '@/types/api';

interface Props {
  question: Question;
  value: RiskCalculatorAnswer | null;
  onChange: (answer: RiskCalculatorAnswer) => void;
  feedback?: RiskCalculatorFeedback | null;
}

// ─── Scenario Card ───────────────────────────────────

function ScenarioCard({ meta }: { meta: RiskCalculatorMetadata['riskCalc'] }) {
  const items = [
    {
      icon: DollarSign,
      label: 'Saldo',
      value: `$ ${meta.balance.toLocaleString('pt-BR')}`
    },
    { icon: Percent, label: 'Risco', value: `${meta.riskPercent}%` },
    {
      icon: TrendingUp,
      label: 'Entrada',
      value: `$ ${meta.entryPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      icon: TrendingDown,
      label: 'Stop',
      value: `$ ${meta.stopPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    }
  ];

  if (meta.contractValue && meta.contractValue !== 1) {
    items.push({
      icon: Info,
      label: 'Valor por contrato',
      value: `$ ${meta.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/50 p-4 sm:grid-cols-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Step-by-step Explanation ────────────────────────

function StepByStep({
  meta,
  feedback
}: {
  meta: RiskCalculatorMetadata['riskCalc'];
  feedback: RiskCalculatorFeedback;
}) {
  const riskValue = meta.balance * (meta.riskPercent / 100);
  const stopDist = Math.abs(meta.entryPrice - meta.stopPrice);
  const contract = meta.contractValue ?? 1;

  return (
    <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-sm">
      <p className="font-semibold text-foreground">📐 Passo a passo</p>
      <ol className="list-inside list-decimal space-y-1.5 text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Risco em $:</span>{' '}
          {meta.balance.toLocaleString('pt-BR')} × {meta.riskPercent}% ={' '}
          <span className="font-semibold text-primary">
            $ {riskValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </li>
        <li>
          <span className="font-medium text-foreground">
            Distância do stop:
          </span>{' '}
          |{meta.entryPrice} − {meta.stopPrice}| ={' '}
          <span className="font-semibold text-primary">
            {stopDist.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </li>
        {contract !== 1 && (
          <li>
            <span className="font-medium text-foreground">
              Valor por contrato:
            </span>{' '}
            <span className="font-semibold text-primary">
              {contract.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </li>
        )}
        <li>
          <span className="font-medium text-foreground">
            Tamanho da posição:
          </span>{' '}
          {riskValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ÷ (
          {stopDist.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          {contract !== 1 &&
            ` × ${contract.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          ) ={' '}
          <span className="font-semibold text-primary">
            {feedback.expectedPositionSize.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
          </span>
        </li>
      </ol>

      <div className="mt-3 flex items-center gap-3 rounded-lg bg-background p-3">
        <div>
          <p className="text-xs text-muted-foreground">Sua resposta</p>
          <p className="text-lg font-bold">{feedback.userPositionSize}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Esperado</p>
          <p className="text-lg font-bold text-primary">
            {feedback.expectedPositionSize}
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Diferença</p>
          <p
            className={cn(
              'text-lg font-bold',
              feedback.label === 'CORRECT'
                ? 'text-green-500'
                : feedback.label === 'PARTIAL'
                  ? 'text-yellow-500'
                  : 'text-red-500'
            )}
          >
            {feedback.diffPercent.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────

const LABEL_CONFIG: Record<string, { className: string; text: string }> = {
  CORRECT: {
    className: 'bg-green-500/10 text-green-600 border-green-500/30',
    text: '✅ Correto'
  },
  PARTIAL: {
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    text: '⚠️ Quase'
  },
  WRONG: {
    className: 'bg-red-500/10 text-red-600 border-red-500/30',
    text: '❌ Incorreto'
  }
};

export function RiskCalculatorRenderer({
  question,
  value,
  onChange,
  feedback
}: Props) {
  const raw = question.metadata?.jsonData as
    | Record<string, unknown>
    | undefined;
  const meta = (raw?.riskCalc ?? raw) as
    | RiskCalculatorMetadata['riskCalc']
    | undefined;

  const [inputValue, setInputValue] = useState<string>(
    value?.riskCalc?.positionSize?.toString() ?? ''
  );

  const hasFeedback = !!feedback;

  const handleChange = (raw: string) => {
    // Allow only numeric input with optional decimal
    const sanitized = raw.replace(/[^0-9.,]/g, '').replace(',', '.');
    setInputValue(sanitized);

    const num = parseFloat(sanitized);
    if (!isNaN(num) && num > 0) {
      onChange({ riskCalc: { positionSize: num } });
    }
  };

  if (!meta) {
    return (
      <div className="rounded-xl border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
        Dados do cenário não disponíveis
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Scenario card */}
      <ScenarioCard meta={meta} />

      {/* Input area */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          Qual o tamanho da posição?
        </label>

        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={hasFeedback}
            placeholder="Ex: 2.50"
            className={cn(
              'w-full rounded-lg border bg-background px-4 py-3 text-lg font-medium',
              'transition-colors placeholder:text-muted-foreground/50',
              'focus:outline-none focus:ring-2 focus:ring-primary/40',
              hasFeedback && 'cursor-default opacity-75'
            )}
          />
        </div>
      </div>

      {/* Feedback */}
      {hasFeedback && (
        <div className="space-y-3">
          {/* Label badge + barra de precisão */}
          <div className="space-y-1.5">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold',
                LABEL_CONFIG[feedback.label]?.className
              )}
            >
              {LABEL_CONFIG[feedback.label]?.text}
              <span className="font-normal opacity-75">
                ({Math.round((feedback.scoreRatio ?? 0) * 100)}% de acerto)
              </span>
            </div>
            {/* Barra proporcional */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  feedback.label === 'CORRECT'
                    ? 'bg-green-500'
                    : feedback.label === 'PARTIAL'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                )}
                style={{
                  width: `${Math.round((feedback.scoreRatio ?? 0) * 100)}%`
                }}
              />
            </div>
          </div>

          {/* Message */}
          {feedback.message && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              💡 {feedback.message}
            </div>
          )}

          {/* Step by step */}
          <StepByStep meta={meta} feedback={feedback} />
        </div>
      )}
    </div>
  );
}
