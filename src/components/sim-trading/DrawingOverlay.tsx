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

  const getChartPointFromCoords = useCallback(
    (x: number, y: number): ChartPoint | null => {
      if (!chart || !series) return null;
      const logical = chart.timeScale().coordinateToLogical(x);
      const price = series.coordinateToPrice(y);

      if (logical === null || price === null) return null;
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
    if (!chart || !series) return;

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

    // Drawing Interaction via Chart Subscriptions
    const handleClick = (param: any) => {
      if (!active || !param.point || !isChartReady) return;
      
      const point = getChartPointFromCoords(param.point.x, param.point.y);
      if (!point) return;

      if (!currentLineRef.current) {
        // Start line
        const startPoint = point;
        currentLineRef.current = { start: startPoint, end: startPoint };
        setCurrentLine({ start: startPoint, end: startPoint });
      } else {
        // Finalize line
        finalizeLine(point);
      }
    };

    const handleCrosshairMove = (param: any) => {
      if (!active || !currentLineRef.current || !param.point) return;
      
      const point = getChartPointFromCoords(param.point.x, param.point.y);
      if (point) {
        currentLineRef.current = { ...currentLineRef.current, end: point };
        setCurrentLine({ ...currentLineRef.current });
      }
    };

    chart.subscribeClick(handleClick);
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleUpdate);
      unsubscribePriceRangeChange?.(handleUpdate);
      chart.unsubscribeClick(handleClick);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [chart, series, active, isChartReady, getChartPointFromCoords]);

  const currentLineRef = useRef<{ start: ChartPoint; end: ChartPoint } | null>(null);

  useEffect(() => {
    if (!active) {
      currentLineRef.current = null;
      setCurrentLine(null);
    }
  }, [active]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && currentLineRef.current) {
        e.preventDefault();
        currentLineRef.current = null;
        setCurrentLine(null);
        console.log('[Drawing] Canceled via Escape');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    onDrawingStateChange?.(active && !!currentLine);
  }, [active, currentLine, onDrawingStateChange]);

  // Symbol switch must intentionally clear all drawings and previews.
  useEffect(() => {
    setLines([]);
    currentLineRef.current = null;
    setCurrentLine(null);
  }, [clearSignal]);

  // ─── Interaction Handlers ──────────────────────────────────────────────────

  const finalizeLine = useCallback(
    (end: ChartPoint) => {
      if (!currentLineRef.current) return;

      const newLine: Line = {
        id: Math.random().toString(36).substr(2, 9),
        start: currentLineRef.current.start,
        end,
        color: '#4361EE'
      };

      setLines((prev) => [...prev, newLine]);
      currentLineRef.current = null;
      setCurrentLine(null);
      onDrawEnd?.(newLine);
    },
    [onDrawEnd]
  );

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

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <svg
        ref={containerRef}
        className="absolute inset-0 w-full h-full touch-none overflow-hidden pointer-events-none"
      >
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
