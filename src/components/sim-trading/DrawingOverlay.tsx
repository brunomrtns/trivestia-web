import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect
} from 'react';
import type { IChartApi, ISeriesApi, Logical } from 'lightweight-charts';
import { useTranslation } from 'react-i18next';

interface ChartPoint {
  logical: Logical;
  price: number;
}

interface ScreenPoint {
  x: number;
  y: number;
}

interface Line {
  id: string;
  start: ChartPoint;
  end: ChartPoint;
  color: string;
}

interface DrawingOverlayProps {
  active: boolean;
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  onDrawEnd?: (line: Line) => void;
  onDrawingStateChange?: (inProgress: boolean) => void;
  clearSignal?: number;
}

export function DrawingOverlay({
  active,
  chart,
  series,
  onDrawEnd,
  onDrawingStateChange,
  clearSignal = 0
}: DrawingOverlayProps) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<{
    start: ChartPoint;
    end: ChartPoint;
  } | null>(null);
  const [, setTick] = useState(0); // Used to force re-render on chart pan/zoom

  const containerRef = useRef<SVGSVGElement>(null);
  const previewLoggedRef = useRef(false);
  const nullPointLoggedRef = useRef(false);
  const isChartReady = Boolean(chart && series);

  // ─── Coordinate Conversion ──────────────────────────────────────────────────

  const getChartPoint = useCallback(
    (e: React.MouseEvent | MouseEvent): ChartPoint | null => {
      if (!containerRef.current || !chart || !series) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      // Clamp coordinates to the drawable area to avoid null conversions on edge clicks.
      const x = Math.max(0, Math.min(rect.width - 1, rawX));
      const y = Math.max(0, Math.min(rect.height - 1, rawY));

      const logical = chart.timeScale().coordinateToLogical(x);
      const price = series.coordinateToPrice(y);

      if (logical === null || price === null) {
        if (!nullPointLoggedRef.current) {
          console.log('[DrawingOverlay] coordinate conversion returned null', {
            logical,
            price,
            x,
            y,
            width: rect.width,
            height: rect.height
          });
          nullPointLoggedRef.current = true;
        }
        return null;
      }

      nullPointLoggedRef.current = false;
      return { logical: logical as Logical, price };
    },
    [chart, series]
  );

  const getScreenPoint = useCallback(
    (point: ChartPoint): ScreenPoint | null => {
      if (!chart || !series) return null;
      const x = chart.timeScale().logicalToCoordinate(point.logical);
      const y = series.priceToCoordinate(point.price);

      if (x === null || y === null) return null;
      return { x, y };
    },
    [chart, series]
  );

  // ─── Event Subscriptions ───────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (!chart) return;

    // Force re-render whenever the chart moves/scales
    const handleUpdate = () => setTick((t) => t + 1);
    const priceScaleApi = chart.priceScale('right') as any;
    const subscribePriceRangeChange =
      typeof priceScaleApi?.subscribePriceRangeChange === 'function'
        ? priceScaleApi.subscribePriceRangeChange.bind(priceScaleApi)
        : null;
    const unsubscribePriceRangeChange =
      typeof priceScaleApi?.unsubscribePriceRangeChange === 'function'
        ? priceScaleApi.unsubscribePriceRangeChange.bind(priceScaleApi)
        : null;

    chart.timeScale().subscribeVisibleTimeRangeChange(handleUpdate);
    subscribePriceRangeChange?.(handleUpdate);

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleUpdate);
      unsubscribePriceRangeChange?.(handleUpdate);
    };
  }, [chart]);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && currentLine) {
        e.preventDefault();
        setCurrentLine(null);
        console.log('[Drawing] Canceled via Escape');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, currentLine]);

  useEffect(() => {
    onDrawingStateChange?.(active && !!currentLine);
    console.log('[DrawingOverlay] onDrawingStateChange', {
      active,
      inProgress: !!currentLine
    });
  }, [active, currentLine, onDrawingStateChange]);

  useEffect(() => {
    console.log('[DrawingOverlay] mount/update', {
      active,
      hasChart: !!chart,
      hasSeries: !!series,
      isChartReady,
      hasCurrentLine: !!currentLine,
      linesCount: lines.length
    });
  }, [active, chart, series, isChartReady, currentLine, lines.length]);

  useEffect(() => {
    if (!active && currentLine) {
      setCurrentLine(null);
    }
  }, [active, currentLine]);

  // Symbol switch must intentionally clear all drawings and previews.
  useEffect(() => {
    setLines([]);
    setCurrentLine(null);
    previewLoggedRef.current = false;
    nullPointLoggedRef.current = false;
    console.log('[DrawingOverlay] drawings explicitly cleared', {
      clearSignal
    });
  }, [clearSignal]);

  // ─── Interaction Handlers ──────────────────────────────────────────────────

  const finalizeLine = useCallback(
    (end: ChartPoint) => {
      if (!currentLine) return;

      const newLine: Line = {
        id: Math.random().toString(36).substr(2, 9),
        start: currentLine.start,
        end,
        color: '#4361EE'
      };

      setLines((prev) => [...prev, newLine]);
      setCurrentLine(null);
      onDrawEnd?.(newLine);
      previewLoggedRef.current = false;
      console.log('[Drawing] Line finalized:', newLine);
    },
    [currentLine, onDrawEnd]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!active || e.button !== 0 || !isChartReady) return;

    console.log('[DrawingOverlay] mouseDown captured', {
      button: e.button,
      isChartReady,
      hasCurrentLine: !!currentLine
    });

    const point = getChartPoint(e);
    if (!point) return;

    if (!currentLine) {
      // First click: start line
      setCurrentLine({ start: point, end: point });
      previewLoggedRef.current = false;
      console.log('[Drawing] Anchor set at:', point);
    } else {
      // Second click: finalize line
      console.log('[DrawingOverlay] second click finalize');
      finalizeLine(point);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!currentLine || !active || !isChartReady) return;
    const point = getChartPoint(e);
    if (point) {
      if (!previewLoggedRef.current) {
        console.log('[DrawingOverlay] preview updating');
        previewLoggedRef.current = true;
      }
      setCurrentLine((prev) => (prev ? { ...prev, end: point } : null));
    }
  };

  // ─── Rendering ─────────────────────────────────────────────────────────────

  if (!active && lines.length === 0) return null;

  const renderLines = () => {
    const elements: React.ReactNode[] = [];

    // Render finalized lines
    lines.forEach((line) => {
      const start = getScreenPoint(line.start);
      const end = getScreenPoint(line.end);
      if (start && end) {
        elements.push(
          <line
            key={line.id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={line.color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      }
    });

    // Render preview line
    if (currentLine) {
      const start = getScreenPoint(currentLine.start);
      const end = getScreenPoint(currentLine.end);
      if (start && end) {
        elements.push(
          <line
            key="preview"
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="#4361EE"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        );
      }
    }

    return elements;
  };

  const isInteractionBlocked = active && isChartReady;

  return (
    <div className="absolute inset-0 z-10">
      <svg
        ref={containerRef}
        className={`absolute inset-0 w-full h-full touch-none overflow-hidden transition-opacity duration-200 ${
          active ? 'opacity-100' : 'opacity-100'
        } ${
          isInteractionBlocked
            ? 'cursor-crosshair pointer-events-auto'
            : 'pointer-events-none'
        }`}
      >
        {/* SVG roots may ignore events on transparent zones; this rect guarantees full-area hit testing. */}
        {isInteractionBlocked && (
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="transparent"
            pointerEvents="all"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          />
        )}

        {renderLines()}
      </svg>

      {/* HTML UI Overlays (responsive to content, not fixed-size SVG) */}
      {active && isChartReady && (
        <div className="absolute top-3 left-3 pointer-events-none select-none">
          {/* Main Instruction Card */}
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
            {/* Status Indicator */}
            <div
              className={`h-3 w-3 rounded-full flex-shrink-0 ${
                currentLine
                  ? 'bg-primary animate-pulse'
                  : 'bg-muted-foreground'
              }`}
            />

            {/* Main Text */}
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
              {currentLine
                ? t('sim.terminal.drawing.instructions.finalizeLine')
                : t('sim.terminal.drawing.instructions.setStartPoint')}
            </span>
          </div>

          {/* Secondary Hint (only when not drawing) */}
          {!currentLine && (
            <div className="mt-2 text-[10px] font-medium italic text-foreground/70">
              {t('sim.terminal.drawing.instructions.escapeHint')}
            </div>
          )}
        </div>
      )}

      {/* Loading state if chart not ready */}
      {active && !isChartReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 rounded-lg bg-background/70 px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {t('sim.terminal.drawing.initializingChartInteraction')}
          </div>
        </div>
      )}
    </div>
  );
}
