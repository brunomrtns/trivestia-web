import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, ChevronLeft, ImagePlus, X } from 'lucide-react';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { getActivityTypeLabel } from '@/lib/utils';
import { ChartMarkupQuestionForm } from '@/components/admin/ChartMarkupQuestionForm';
import { RiskCalculatorQuestionForm } from '@/components/admin/RiskCalculatorQuestionForm';
import { SimTradingQuestionForm } from '@/components/admin/SimTradingQuestionForm';
import { QuestionPreviewCard } from '@/components/admin/QuestionPreviewCard';
import type { ActivityType } from '@/types/api';

// ─── SimConfigSummary ────────────────────────────────────────────────────────

function SimConfigSummary({ cfg }: { cfg: Record<string, unknown> }) {
  const cc = cfg.candleConfig as Record<string, unknown> | undefined;
  const ec = cfg.executionConfig as Record<string, unknown> | undefined;
  const sc = cfg.scoringConfig as Record<string, unknown> | undefined;
  const tfs = cc?.timeframeMs
    ? (() => {
        const m = (cc.timeframeMs as number) / 60_000;
        return m >= 60 ? `${m / 60}h` : `${m}min`;
      })()
    : '—';
  const items = [
    { label: 'Candles', value: `${cc?.numCandles ?? '—'} × ${tfs}` },
    { label: 'Preço inicial', value: `$${cc?.startPrice ?? '—'}` },
    { label: 'Volatilidade', value: String(cc?.volatility ?? '—') },
    { label: 'Saldo inicial', value: `$${ec?.initialBalance ?? '—'}` },
    { label: 'Taxa', value: `${ec?.feeBps ?? '—'} bps` },
    { label: 'PnL mín.', value: `${sc?.passingPnlPercent ?? '—'}%` },
    { label: 'DD máx.', value: `${sc?.maxDrawdownPercent ?? '—'}%` },
    { label: 'Trades mín.', value: String(sc?.minTradeCount ?? '—') }
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 rounded-lg bg-muted/40 px-4 py-3 text-xs">
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-1">
          <span className="text-muted-foreground">{label}:</span>
          <span className="font-mono font-semibold">{value}</span>
        </div>
      ))}
    </div>
  );
}

// Schema para criação de questão com opções dinâmicas
const optionSchema = z.object({
  text: z.string().min(1, 'Obrigatório'),
  isCorrect: z.boolean(),
  order: z.number()
});

const questionSchema = z.object({
  statement: z.string().min(5, 'Mínimo 5 caracteres'),
  imageUrl: z.string().url().optional().nullable(),
  explanation: z.string().optional(),
  difficulty: z.number().min(1).max(5).default(3),
  weight: z.number().min(1).default(1),
  options: z.array(optionSchema),
  // Indice da opcao correta (single-select). Transformado em isCorrect no submit.
  correctIndex: z.coerce.number().optional(),
  metadata: z.object({ jsonData: z.record(z.unknown()) }).optional()
});

type QuestionFormData = z.infer<typeof questionSchema>;

function QuestionForm({
  activityType,
  onSave,
  onCancel,
  loading,
  slug
}: {
  activityType: ActivityType;
  onSave: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  slug: string;
}) {
  const showOptions = activityType !== 'TEXT_INPUT';
  const isTrueFalse = activityType === 'TRUE_FALSE';

  // Estado do upload de imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      difficulty: 3,
      weight: 1,
      correctIndex: undefined,
      options: isTrueFalse
        ? [
            { text: 'Verdadeiro', isCorrect: false, order: 0 },
            { text: 'Falso', isCorrect: false, order: 1 }
          ]
        : showOptions
          ? [
              { text: '', isCorrect: false, order: 0 },
              { text: '', isCorrect: false, order: 1 }
            ]
          : []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options'
  });

  // Ao selecionar arquivo: cria preview local
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue('imageUrl', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Para MULTIPLE_CHOICE / TRUE_FALSE / SCENARIO: radio (apenas 1 correta)
  // Para MULTIPLE_SELECT: checkbox (n corretas)
  const isSingleSelect = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SCENARIO'].includes(
    activityType
  );

  // Transforma correctIndex -> isCorrect antes de chamar onSave
  const handleFormSubmit = async (data: QuestionFormData) => {
    let imageUrl = data.imageUrl ?? null;

    // Se há um arquivo novo selecionado, faz upload antes de salvar
    if (imageFile) {
      try {
        setUploading(true);
        imageUrl = await adminEndpoints.uploadQuestionImage(slug, imageFile);
      } catch {
        toast.error('Erro ao fazer upload da imagem.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const processedData = {
      ...data,
      imageUrl,
      options: isSingleSelect
        ? data.options.map((opt, i) => ({
            ...opt,
            isCorrect: i === Number(data.correctIndex)
          }))
        : data.options
    };
    await onSave(processedData);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Enunciado</label>
        <textarea
          rows={3}
          className="w-full resize-none rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          {...register('statement')}
        />
        {errors.statement && (
          <p className="mt-1 text-xs text-destructive">
            {errors.statement.message}
          </p>
        )}
      </div>

      {/* Upload de imagem opcional para o enunciado */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Imagem do enunciado{' '}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        {imagePreview ? (
          <div className="relative overflow-hidden rounded-xl border">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-48 w-full object-contain bg-muted/30"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 py-6 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            <ImagePlus className="h-5 w-5" />
            Clique para adicionar imagem (JPG, PNG, WebP — máx. 5 MB)
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

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

      {/* Opções — só para atividades que não são TEXT_INPUT */}
      {showOptions && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Opções{' '}
              <span className="text-xs text-muted-foreground">
                (
                {isSingleSelect
                  ? 'marque a correta'
                  : 'marque todas as corretas'}
                )
              </span>
            </label>
            {/* TRUE_FALSE tem opcoes fixas — nao permite adicionar */}
            {!isTrueFalse && (
              <button
                type="button"
                onClick={() =>
                  append({ text: '', isCorrect: false, order: fields.length })
                }
                className="flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium hover:bg-accent"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </button>
            )}
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3">
              {isSingleSelect ? (
                // Radio em grupo unico: todos compartilham name='correctIndex'
                // Assim o browser garante selecao exclusiva
                <input
                  type="radio"
                  value={String(index)}
                  {...register('correctIndex')}
                  className="h-4 w-4 accent-primary"
                />
              ) : (
                // Checkbox individual por opcao
                <input
                  type="checkbox"
                  {...register(`options.${index}.isCorrect`)}
                  className="h-4 w-4 accent-primary"
                />
              )}
              <input
                placeholder={`Opção ${index + 1}`}
                // TRUE_FALSE: texto fixo, nao editavel
                readOnly={isTrueFalse}
                className={`flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${
                  isTrueFalse ? 'cursor-default opacity-70' : ''
                }`}
                {...register(`options.${index}.text`)}
              />
              {/* TRUE_FALSE: sem remocao; outros: so se tiver mais de 2 */}
              {!isTrueFalse && fields.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-muted-foreground transition hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {(loading || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
          {uploading ? 'Enviando imagem...' : 'Salvar questão'}
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

export default function AdminQuestionsPage() {
  const { lessonId, activityId, tenantSlug } = useParams<{
    lessonId: string;
    activityId: string;
    tenantSlug: string;
  }>();
  const slug = tenantSlug ?? '';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  // Busca a atividade para obter o tipo real
  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', slug, lessonId, activityId],
    queryFn: () => learningEndpoints.getActivity(slug, lessonId!, activityId!),
    enabled: !!lessonId && !!activityId
  });

  // Para recuperar o tipo da activity, precisamos buscá-la via um endpoint de listagem
  // Aqui buscamos as questions diretamente — o activityType virá junto
  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions', slug, activityId],
    queryFn: () => adminEndpoints.getQuestions(slug, activityId!),
    enabled: !!activityId
  });

  const createMut = useMutation({
    mutationFn: (data: QuestionFormData) =>
      adminEndpoints.createQuestion(slug, activityId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions', slug, activityId] });
      qc.invalidateQueries({ queryKey: ['activity', slug, lessonId, activityId] });
      setAdding(false);
      toast.success('Questão criada!');
    },
    onError: () => toast.error('Erro ao criar questão.')
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      adminEndpoints.deleteQuestion(slug, activityId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions', slug, activityId] });
      qc.invalidateQueries({ queryKey: ['activity', slug, lessonId, activityId] });
      toast.success('Questão excluída.');
    },
    onError: () => toast.error('Erro ao excluir questão.')
  });

  const activityType: ActivityType = activity?.type ?? 'MULTIPLE_CHOICE';

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">
              {loadingActivity ? (
                <span className="inline-block h-8 w-48 animate-pulse rounded bg-muted" />
              ) : (
                (activity?.title ?? 'Questões')
              )}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tipo:{' '}
              <strong className="text-foreground">
                {loadingActivity ? '...' : getActivityTypeLabel(activityType)}
              </strong>
            </p>
          </div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              disabled={
                activityType === 'SIM_TRADING_CHALLENGE' &&
                Array.isArray(questions) &&
                questions.length > 0
              }
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {activityType === 'SIM_TRADING_CHALLENGE'
                ? 'Configurar Cenário'
                : 'Nova questão'}
            </button>
          )}
        </div>
      </div>

      {adding &&
        (activityType === 'CHART_MARKUP' ? (
          <ChartMarkupQuestionForm
            onSave={(data) => createMut.mutateAsync(data as any)}
            onCancel={() => setAdding(false)}
            loading={createMut.isPending}
          />
        ) : activityType === 'RISK_CALCULATOR' ? (
          <RiskCalculatorQuestionForm
            onSave={(data) => createMut.mutateAsync(data as any)}
            onCancel={() => setAdding(false)}
            loading={createMut.isPending}
          />
        ) : activityType === 'SIM_TRADING_CHALLENGE' ? (
          <SimTradingQuestionForm
            initialData={questions?.[0]?.metadata?.jsonData}
            onSave={(data) => createMut.mutateAsync(data as any)}
            onCancel={() => setAdding(false)}
            loading={createMut.isPending}
          />
        ) : (
          <QuestionForm
            activityType={activityType}
            slug={slug}
            onSave={(data) => createMut.mutateAsync(data)}
            onCancel={() => setAdding(false)}
            loading={createMut.isPending}
          />
        ))}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {(
            questions as
              | {
                  id: string;
                  statement: string;
                  options: { isCorrect: boolean; text: string }[];
                  metadata?: { jsonData?: Record<string, unknown> };
                }[]
              | undefined
          )?.map((q, i) => (
            <div
              key={q.id}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="mb-1 flex items-start justify-between gap-4">
                <p className="font-medium">
                  <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                  {activityType === 'SIM_TRADING_CHALLENGE'
                    ? 'Configuração do Cenário de Trading'
                    : q.statement}
                </p>
                <button
                  onClick={() => {
                    if (confirm('Excluir esta questão?'))
                      deleteMut.mutate(q.id);
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <QuestionPreviewCard activityType={activityType} question={q} />

              {activityType === 'SIM_TRADING_CHALLENGE' &&
                q.metadata?.jsonData && (
                  <SimConfigSummary
                    cfg={q.metadata.jsonData as Record<string, unknown>}
                  />
                )}
            </div>
          ))}

          {Array.isArray(questions) && questions.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              Nenhuma questão ainda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
