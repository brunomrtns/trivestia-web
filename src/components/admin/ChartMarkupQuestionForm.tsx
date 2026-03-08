import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Crosshair, Eraser, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Schema ──────────────────────────

// (moved inside component to allow useTranslation)

interface ChartMarkupFormData {
  statement: string;
  explanation?: string;
  difficulty: number;
  weight: number;
  imageUrl: string;
  zoneType: 'SUPPORT' | 'RESISTANCE' | 'SUPPLY' | 'DEMAND';
  threshold: number;
  expected: { x1: number; y1: number; x2: number; y2: number };
}

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

export function ChartMarkupQuestionForm({ onSave, onCancel, loading }: Props) {
  const { t } = useTranslation();
  const chartMarkupSchema = z.object({
    statement: z
      .string()
      .min(5, t('admin.chartMarkupForm.validation.statement')),
    explanation: z.string().optional(),
    difficulty: z.number().min(1).max(5).default(3),
    weight: z.number().min(1).default(1),
    imageUrl: z.string().url(t('admin.chartMarkupForm.validation.imageUrl')),
    zoneType: z.enum(['SUPPORT', 'RESISTANCE', 'SUPPLY', 'DEMAND']),
    threshold: z.number().min(0.1).max(1).default(0.5),
    expected: z.object({
      x1: z.number().min(0).max(1),
      y1: z.number().min(0).max(1),
      x2: z.number().min(0).max(1),
      y2: z.number().min(0).max(1)
    })
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [drawMode, setDrawMode] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [drawCurrent, setDrawCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ChartMarkupFormData>({
    resolver: zodResolver(chartMarkupSchema),
    defaultValues: {
      difficulty: 3,
      weight: 1,
      zoneType: 'SUPPORT',
      threshold: 0.5,
      expected: { x1: 0, y1: 0, x2: 0, y2: 0 }
    }
  });

  const imageUrl = watch('imageUrl');
  const expected = watch('expected');
  const hasZone = expected.x2 > expected.x1 && expected.y2 > expected.y1;

  // ── Pointer handlers ──

  const getRelativePos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawMode) return;
      e.preventDefault();
      const pos = getRelativePos(e);
      if (!pos) return;
      setDrawing(true);
      setDrawStart(pos);
      setDrawCurrent(pos);
    },
    [drawMode, getRelativePos]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getRelativePos(e);
      if (pos) setDrawCurrent(pos);
    },
    [drawing, getRelativePos]
  );

  const handlePointerUp = useCallback(() => {
    if (!drawing || !drawStart || !drawCurrent || !containerRef.current) return;
    setDrawing(false);

    const rect = containerRef.current.getBoundingClientRect();
    const x1 = Math.min(drawStart.x, drawCurrent.x) / rect.width;
    const y1 = Math.min(drawStart.y, drawCurrent.y) / rect.height;
    const x2 = Math.max(drawStart.x, drawCurrent.x) / rect.width;
    const y2 = Math.max(drawStart.y, drawCurrent.y) / rect.height;

    const area = (x2 - x1) * (y2 - y1);
    if (area < 0.0004) {
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    setValue('expected', { x1, y1, x2, y2 }, { shouldValidate: true });
    setDrawMode(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [drawing, drawStart, drawCurrent, setValue]);

  const handleClear = () => {
    setValue('expected', { x1: 0, y1: 0, x2: 0, y2: 0 });
    setDrawStart(null);
    setDrawCurrent(null);
    setDrawMode(false);
  };

  // ── Submit ──

  const onSubmit = async (data: ChartMarkupFormData) => {
    await onSave({
      statement: data.statement,
      explanation: data.explanation,
      difficulty: data.difficulty,
      weight: data.weight,
      options: [],
      metadata: {
        chartMarkup: {
          imageUrl: data.imageUrl,
          expected: [
            {
              ...data.expected,
              type: data.zoneType
            }
          ],
          threshold: data.threshold
        }
      }
    });
  };

  const containerW = containerRef.current?.getBoundingClientRect().width ?? 1;
  const containerH = containerRef.current?.getBoundingClientRect().height ?? 1;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm"
    >
      {/* Statement */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {t('admin.chartMarkupForm.statementLabel')}
        </label>
        <textarea
          rows={3}
          className="w-full resize-none rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder={t('admin.chartMarkupForm.statementPlaceholder')}
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
          {t('admin.chartMarkupForm.explanationLabel')}
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
            {t('admin.chartMarkupForm.difficultyLabel')}
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
          <label className="mb-1 block text-sm font-medium">
            {t('admin.chartMarkupForm.weightLabel')}
          </label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            {...register('weight', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {t('admin.chartMarkupForm.imageUrlLabel')}
        </label>
        <input
          type="url"
          className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder={t('admin.chartMarkupForm.imageUrlPlaceholder')}
          {...register('imageUrl')}
          onChange={(e) => {
            register('imageUrl').onChange(e);
            setPreviewUrl(e.target.value);
            setImageLoaded(false);
          }}
        />
        {errors.imageUrl && (
          <p className="mt-1 text-xs text-destructive">
            {errors.imageUrl.message}
          </p>
        )}
      </div>

      {/* Zone type + threshold */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('admin.chartMarkupForm.zoneTypeLabel')}
          </label>
          <select
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            {...register('zoneType')}
          >
            <option value="SUPPORT">
              {t('admin.chartMarkupForm.zoneTypes.support')}
            </option>
            <option value="RESISTANCE">
              {t('admin.chartMarkupForm.zoneTypes.resistance')}
            </option>
            <option value="SUPPLY">
              {t('admin.chartMarkupForm.zoneTypes.supply')}
            </option>
            <option value="DEMAND">
              {t('admin.chartMarkupForm.zoneTypes.demand')}
            </option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('admin.chartMarkupForm.thresholdLabel')}
          </label>
          <input
            type="number"
            min={0.1}
            max={1}
            step={0.05}
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            {...register('threshold', { valueAsNumber: true })}
          />
          {errors.threshold && (
            <p className="mt-1 text-xs text-destructive">
              {errors.threshold.message}
            </p>
          )}
        </div>
      </div>

      {/* Visual zone editor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {t('admin.chartMarkupForm.answerZoneLabel')}
        </label>

        <div
          ref={containerRef}
          className={cn(
            'relative overflow-hidden rounded-xl border bg-muted select-none',
            drawMode && 'cursor-crosshair'
          )}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={() => drawing && handlePointerUp()}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {previewUrl || imageUrl ? (
            <img
              src={previewUrl || imageUrl}
              alt={t('admin.questions.form.previewAlt')}
              className="block w-full h-auto pointer-events-none"
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              {t('admin.chartMarkupForm.imagePrompt')}
            </div>
          )}

          {/* SVG overlay */}
          <svg className="absolute inset-0 h-full w-full">
            {/* Current drawing */}
            {drawing && drawStart && drawCurrent && (
              <rect
                x={Math.min(drawStart.x, drawCurrent.x)}
                y={Math.min(drawStart.y, drawCurrent.y)}
                width={Math.abs(drawCurrent.x - drawStart.x)}
                height={Math.abs(drawCurrent.y - drawStart.y)}
                fill="rgba(34, 197, 94, 0.2)"
                stroke="rgb(34, 197, 94)"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
            )}

            {/* Saved expected zone */}
            {hasZone && !drawing && containerRef.current && (
              <rect
                x={expected.x1 * containerW}
                y={expected.y1 * containerH}
                width={(expected.x2 - expected.x1) * containerW}
                height={(expected.y2 - expected.y1) * containerH}
                fill="rgba(34, 197, 94, 0.15)"
                stroke="rgb(34, 197, 94)"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        {/* Draw controls */}
        {(previewUrl || imageUrl) && imageLoaded && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDrawMode(!drawMode)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                drawMode
                  ? 'border-green-500 bg-green-500/10 text-green-600'
                  : 'hover:bg-accent'
              )}
            >
              <Crosshair className="h-3.5 w-3.5" />
              {drawMode
                ? t('admin.chartMarkupForm.drawing')
                : t('admin.chartMarkupForm.drawButton')}
            </button>
            {hasZone && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
              >
                <Eraser className="h-3.5 w-3.5" />
                {t('admin.chartMarkupForm.clearButton')}
              </button>
            )}
          </div>
        )}

        {/* Coordinates display */}
        {hasZone && (
          <p className="text-xs text-muted-foreground">
            Zona: ({expected.x1.toFixed(3)}, {expected.y1.toFixed(3)}) → (
            {expected.x2.toFixed(3)}, {expected.y2.toFixed(3)})
          </p>
        )}

        {errors.expected && (
          <p className="text-xs text-destructive">
            {t('admin.chartMarkupForm.zoneError')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !hasZone}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('admin.chartMarkupForm.saveButton')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          {t('common.actions.cancel')}
        </button>
      </div>
    </form>
  );
}
