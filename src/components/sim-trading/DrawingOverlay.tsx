import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo
} from 'react';
import type { IChartApi, ISeriesApi, Logical, Time } from 'lightweight-charts';
import { useTranslation } from 'react-i18next';
import { DrawingPrimitive, type ChartPoint, type LineData } from './DrawingPrimitive';

interface DrawingOverlayProps {
  active: boolean;
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  onDrawEnd?: (line: LineData) => void;
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
  const [lines, setLines] = useState<LineData[]>([]);
  const [currentLine, setCurrentLine] = useState<{
    start: ChartPoint;
    end: ChartPoint;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isChartReady = Boolean(chart && series);

  // ─── Native Primitive Integration ──────────────────────────────────────────

  const primitive = useMemo(() => new DrawingPrimitive(), []);

  useEffect(() => {
    if (!series) return;
    series.attachPrimitive(primitive);
    return () => {
      series.detachPrimitive(primitive);
    };
  }, [series, primitive]);

  useEffect(() => {
    primitive.setData(lines, currentLine);
    // Force chart redraw
    if (chart) {
      chart.timeScale().applyOptions({}); 
    }
  }, [lines, currentLine, primitive, chart]);

  // ─── Coordinate Conversion ──────────────────────────────────────────────────

  const getChartPointFromCoords = useCallback(
    (x: number, y: number): ChartPoint | null => {
      if (!chart || !series) return null;
      const timeScale = chart.timeScale();
      const logical = timeScale.coordinateToLogical(x);
      const price = series.coordinateToPrice(y);

      if (logical === null || price === null) return null;

      return {
        logical: logical as Logical,
        price
      };
    },
    [chart, series]
  );

  // ─── Event Subscriptions ───────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (!chart || !series) return;

    // Drawing Interaction via Chart Subscriptions
    const handleClick = (param: any) => {
      if (!active || !param.point || !isChartReady) return;
      
      const point = getChartPointFromCoords(param.point.x, param.point.y);
      if (!point) return;

      if (!currentLineRef.current) {
        // Start line
        currentLineRef.current = { start: point, end: point };
        setCurrentLine({ start: point, end: point });
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

      const newLine: LineData = {
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

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
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
