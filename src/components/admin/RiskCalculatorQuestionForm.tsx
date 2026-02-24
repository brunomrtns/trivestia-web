import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown,
  Info,
  Loader2
} from 'lucide-react';

// ─── Schema ──────────────────────────────────────────

const riskCalcSchema = z.object({
  statement: z.string().min(5, 'Mínimo 5 caracteres'),
  explanation: z.string().optional(),
  difficulty: z.number().min(1).max(5).default(3),
  weight: z.number().min(1).default(1),
  balance: z.number().positive('Deve ser positivo'),
  riskPercent: z.number().positive('Deve ser positivo').max(100, 'Máximo 100%'),
  entryPrice: z.number().positive('Deve ser positivo'),
  stopPrice: z.number().positive('Deve ser positivo'),
  contractValue: z.number().positive('Deve ser positivo').default(1),
  rounding: z.number().int().min(0).max(8).default(2),
  tolerancePercent: z.number().min(0).max(100).default(5)
});

type RiskCalcFormData = z.infer<typeof riskCalcSchema>;

interface Props {
  onSave: (data: {
    statement: string;
    explanation?: string;
    difficulty: number;
    weight: number;
    options: never[];
    metadata: Record<string, unknown>;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

// ─── Component ───────────────────────────────────────

export function RiskCalculatorQuestionForm({
  onSave,
  onCancel,
  loading
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RiskCalcFormData>({
    resolver: zodResolver(riskCalcSchema),
    defaultValues: {
      difficulty: 3,
      weight: 1,
      balance: 10000,
      riskPercent: 2,
      entryPrice: 100,
      stopPrice: 95,
      contractValue: 1,
      rounding: 2,
      tolerancePercent: 5
    }
  });

  const balance = watch('balance');
  const riskPercent = watch('riskPercent');
  const entryPrice = watch('entryPrice');
  const stopPrice = watch('stopPrice');
  const contractValue = watch('contractValue');
  const rounding = watch('rounding');

  const expectedSize = useMemo(() => {
    if (!balance || !riskPercent || !entryPrice || !stopPrice) return null;
    const riskValue = balance * (riskPercent / 100);
    const stopDist = Math.abs(entryPrice - stopPrice);
    if (stopDist === 0) return null;
    const cv = contractValue || 1;
    const raw = riskValue / (stopDist * cv);
    const factor = Math.pow(10, rounding ?? 2);
    return Math.round(raw * factor) / factor;
  }, [balance, riskPercent, entryPrice, stopPrice, contractValue, rounding]);

  const onSubmit = async (data: RiskCalcFormData) => {
    await onSave({
      statement: data.statement,
      explanation: data.explanation,
      difficulty: data.difficulty,
      weight: data.weight,
      options: [],
      metadata: {
        riskCalc: {
          balance: data.balance,
          riskPercent: data.riskPercent,
          entryPrice: data.entryPrice,
          stopPrice: data.stopPrice,
          contractValue: data.contractValue,
          rounding: data.rounding,
          tolerancePercent: data.tolerancePercent
        }
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm"
    >
      {/* Statement */}
      <div>
        <label className="mb-1 block text-sm font-medium">Enunciado</label>
        <textarea
          rows={3}
          className="w-full resize-none rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Ex: Calcule o tamanho da posição para este cenário"
          {...register('statement')}
        />
        {errors.statement && (
          <p className="mt-1 text-xs text-destructive">
            {errors.statement.message}
          </p>
        )}
      </div>

      {/* Explanation */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Explicação (pós-resposta)
        </label>
        <textarea
          rows={2}
          className="w-full resize-none rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          {...register('explanation')}
        />
      </div>

      {/* Difficulty + Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Dificuldade (1-5)
          </label>
          <input
            type="number"
            min={1}
            max={5}
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            {...register('difficulty', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Peso</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            {...register('weight', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Scenario Fields */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">📊 Dados do cenário</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              Saldo da conta
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...register('balance', { valueAsNumber: true })}
            />
            {errors.balance && (
              <p className="mt-1 text-xs text-destructive">
                {errors.balance.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
              Risco (%)
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...register('riskPercent', { valueAsNumber: true })}
            />
            {errors.riskPercent && (
              <p className="mt-1 text-xs text-destructive">
                {errors.riskPercent.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              Preço de entrada
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...register('entryPrice', { valueAsNumber: true })}
            />
            {errors.entryPrice && (
              <p className="mt-1 text-xs text-destructive">
                {errors.entryPrice.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
              Preço do stop
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...register('stopPrice', { valueAsNumber: true })}
            />
            {errors.stopPrice && (
              <p className="mt-1 text-xs text-destructive">
                {errors.stopPrice.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              Valor/contrato
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...register('contractValue', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Casas decimais
            </label>
            <input
              type="number"
              min={0}
              max={8}
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...register('rounding', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Tolerância (%)
            </label>
            <input
              type="number"
              step="any"
              min={0}
              max={100}
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...register('tolerancePercent', { valueAsNumber: true })}
            />
            {errors.tolerancePercent && (
              <p className="mt-1 text-xs text-destructive">
                {errors.tolerancePercent.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preview card */}
      {expectedSize !== null && (
        <div className="rounded-xl border bg-muted/50 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Preview — resposta esperada
          </p>
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-primary">{expectedSize}</p>
            <span className="text-sm text-muted-foreground">
              contratos / lotes
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Risco: ${((balance * riskPercent) / 100).toFixed(2)} ÷ Stop dist:{' '}
            {Math.abs(entryPrice - stopPrice).toFixed(2)}
            {contractValue !== 1 && ` × Contrato: ${contractValue}`}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar questão
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
