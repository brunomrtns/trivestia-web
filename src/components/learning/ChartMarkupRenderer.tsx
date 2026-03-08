import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Crosshair, Eraser, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Question,
  ChartMarkupAnswer,
  ChartMarkupZone,
  ChartMarkupFeedback,
  ChartMarkupMetadata,
  BBox
} from '@/types/api';

interface Props {
  question: Question;
  value: ChartMarkupAnswer | null;
  onChange: (answer: ChartMarkupAnswer) => void;
  feedback?: ChartMarkupFeedback | null;
}

// ─── Helpers ──────────────────────────────────────────

function normalizeRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
  containerW: number,
  containerH: number
): BBox {
  return {
    x1: Math.min(start.x, end.x) / containerW,
    y1: Math.min(start.y, end.y) / containerH,
    x2: Math.max(start.x, end.x) / containerW,
    y2: Math.max(start.y, end.y) / containerH
  };
}

const LABEL_COLORS: Record<string, string> = {
  CORRECT: 'bg-green-500/90 text-white',
  PARTIAL: 'bg-yellow-500/90 text-white',
  WRONG: 'bg-red-500/90 text-white'
};

// ─── Component ────────────────────────────────────────

export function ChartMarkupRenderer({
  question,
  value,
  onChange,
  feedback
}: Props) {
  const { t } = useTranslation();

  const LABEL_TEXT: Record<string, string> = {
    CORRECT: t('learning.chartMarkup.labels.correct'),
    PARTIAL: t('learning.chartMarkup.labels.partial'),
    WRONG: t('learning.chartMarkup.labels.wrong')
  };

  const raw = question.metadata?.jsonData as
    | Record<string, unknown>
    | undefined;
  const meta = (raw?.chartMarkup ?? raw) as
    | ChartMarkupMetadata['chartMarkup']
    | undefined;

  const imageUrl = meta?.imageUrl ?? '';

  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [drawCurrent, setDrawCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [drawnZone, setDrawnZone] = useState<ChartMarkupZone | null>(
    value?.chartMarkup?.zones?.[0] ?? null
  );
  const [drawMode, setDrawMode] = useState(false);

  // Sync from parent value
  useEffect(() => {
    if (value?.chartMarkup?.zones?.[0]) {
      setDrawnZone(value.chartMarkup.zones[0]);
    }
  }, [value]);

  const getRelativePos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawMode || feedback) return;
      e.preventDefault();
      const pos = getRelativePos(e);
      if (!pos) return;
      setDrawing(true);
      setDrawStart(pos);
      setDrawCurrent(pos);
    },
    [drawMode, feedback, getRelativePos]
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
    const bbox = normalizeRect(drawStart, drawCurrent, rect.width, rect.height);

    // Minimum size check (at least 2% of image)
    const area = (bbox.x2 - bbox.x1) * (bbox.y2 - bbox.y1);
    if (area < 0.0004) {
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const zone: ChartMarkupZone = {
      ...bbox,
      type: 'SUPPORT' // default — could be made selectable
    };

    setDrawnZone(zone);
    setDrawMode(false);
    onChange({ chartMarkup: { zones: [zone] } });

    setDrawStart(null);
    setDrawCurrent(null);
  }, [drawing, drawStart, drawCurrent, onChange]);

  const handleClear = () => {
    setDrawnZone(null);
    setDrawStart(null);
    setDrawCurrent(null);
    setDrawMode(false);
    onChange({ chartMarkup: { zones: [] } });
  };

  // ── Render ──

  const hasFeedback = !!feedback;
  const containerW = containerRef.current?.getBoundingClientRect().width ?? 1;
  const containerH = containerRef.current?.getBoundingClientRect().height ?? 1;

  return (
    <div className="space-y-4">
      {/* Image container */}
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden rounded-xl border bg-muted select-none',
          drawMode && !hasFeedback && 'cursor-crosshair'
        )}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => drawing && handlePointerUp()}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={t('learning.chartMarkup.imageAlt')}
            className="block w-full h-auto pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {t('learning.chartMarkup.imageUnavailable')}
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
              fill="rgba(59, 130, 246, 0.2)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
          )}

          {/* Drawn zone (user) */}
          {drawnZone && !drawing && containerRef.current && (
            <rect
              x={drawnZone.x1 * containerW}
              y={drawnZone.y1 * containerH}
              width={(drawnZone.x2 - drawnZone.x1) * containerW}
              height={(drawnZone.y2 - drawnZone.y1) * containerH}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
            />
          )}

          {/* Feedback: expected zone (green) */}
          {hasFeedback && feedback.expected && containerRef.current && (
            <rect
              x={feedback.expected.x1 * containerW}
              y={feedback.expected.y1 * containerH}
              width={(feedback.expected.x2 - feedback.expected.x1) * containerW}
              height={
                (feedback.expected.y2 - feedback.expected.y1) * containerH
              }
              fill="rgba(34, 197, 94, 0.15)"
              stroke="rgb(34, 197, 94)"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
          )}

          {/* Feedback: user zone (blue solid) */}
          {hasFeedback && feedback.user && containerRef.current && (
            <rect
              x={feedback.user.x1 * containerW}
              y={feedback.user.y1 * containerH}
              width={(feedback.user.x2 - feedback.user.x1) * containerW}
              height={(feedback.user.y2 - feedback.user.y1) * containerH}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Feedback badge + progress bar */}
        {hasFeedback && (
          <div className="absolute right-3 top-3 flex w-44 flex-col items-end gap-1.5">
            <span
              className={cn(
                'w-full rounded-lg px-3 py-1.5 text-center text-sm font-bold shadow-md',
                LABEL_COLORS[feedback.label]
              )}
            >
              {LABEL_TEXT[feedback.label]}
            </span>
            {/* Barra de precisão proporcional */}
            <div className="w-full rounded-full bg-black/30 shadow-inner">
              <div
                className={cn(
                  'h-2.5 rounded-full transition-all duration-500',
                  feedback.label === 'CORRECT'
                    ? 'bg-green-400'
                    : feedback.label === 'PARTIAL'
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                )}
                style={{
                  width: `${Math.round((feedback.scoreRatio ?? feedback.iou) * 100)}%`
                }}
              />
            </div>
            <span className="text-xs font-semibold text-white drop-shadow">
              {Math.round((feedback.scoreRatio ?? feedback.iou) * 100)}
              {t('learning.chartMarkup.overlapSuffix')}
            </span>
          </div>
        )}
      </div>

      {/* Feedback message */}
      {hasFeedback && feedback.message && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          💡 {feedback.message}
        </div>
      )}

      {/* Controls */}
      {!hasFeedback && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDrawMode(!drawMode)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
              drawMode
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:bg-accent'
            )}
          >
            <Crosshair className="h-4 w-4" />
            {drawMode
              ? t('learning.chartMarkup.drawing')
              : t('learning.chartMarkup.drawButton')}
          </button>

          {drawnZone && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Eraser className="h-4 w-4" />
              {t('learning.chartMarkup.clearButton')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
