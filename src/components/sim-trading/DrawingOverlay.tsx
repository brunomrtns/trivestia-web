import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
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
}

export function DrawingOverlay({ active, chart, series, onDrawEnd, onDrawingStateChange }: DrawingOverlayProps) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<{ start: ChartPoint; end: ChartPoint } | null>(null);
  const [, setTick] = useState(0); // Used to force re-render on chart pan/zoom
  
  const containerRef = useRef<SVGSVGElement>(null);
  const previewLoggedRef = useRef(false);
  const nullPointLoggedRef = useRef(false);
  const isChartReady = Boolean(chart && series);

  // ─── Coordinate Conversion ──────────────────────────────────────────────────

  const getChartPoint = useCallback((e: React.MouseEvent | MouseEvent): ChartPoint | null => {
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
          height: rect.height,
        });
        nullPointLoggedRef.current = true;
      }
      return null;
    }

    nullPointLoggedRef.current = false;
    return { logical: logical as Logical, price };
  }, [chart, series]);

  const getScreenPoint = useCallback((point: ChartPoint): ScreenPoint | null => {
    if (!chart || !series) return null;
    const x = chart.timeScale().logicalToCoordinate(point.logical);
    const y = series.priceToCoordinate(point.price);

    if (x === null || y === null) return null;
    return { x, y };
  }, [chart, series]);

  // ─── Event Subscriptions ───────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (!chart) return;
    
    // Force re-render whenever the chart moves/scales
    const handleUpdate = () => setTick(t => t + 1);
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
      inProgress: !!currentLine,
    });
  }, [active, currentLine, onDrawingStateChange]);

  useEffect(() => {
    console.log('[DrawingOverlay] mount/update', {
      active,
      hasChart: !!chart,
      hasSeries: !!series,
      isChartReady,
      hasCurrentLine: !!currentLine,
      linesCount: lines.length,
    });
  }, [active, chart, series, isChartReady, currentLine, lines.length]);

  useEffect(() => {
    if (!active && currentLine) {
      setCurrentLine(null);
    }
  }, [active, currentLine]);

  // ─── Interaction Handlers ──────────────────────────────────────────────────

  const finalizeLine = useCallback((end: ChartPoint) => {
    if (!currentLine) return;

    const newLine: Line = {
      id: Math.random().toString(36).substr(2, 9),
      start: currentLine.start,
      end,
      color: '#4361EE',
    };

    setLines(prev => [...prev, newLine]);
    setCurrentLine(null);
    onDrawEnd?.(newLine);
    previewLoggedRef.current = false;
    console.log('[Drawing] Line finalized:', newLine);
  }, [currentLine, onDrawEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!active || e.button !== 0 || !isChartReady) return;

    console.log('[DrawingOverlay] mouseDown captured', {
      button: e.button,
      isChartReady,
      hasCurrentLine: !!currentLine,
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
      setCurrentLine(prev => prev ? { ...prev, end: point } : null);
    }
  };

  // ─── Rendering ─────────────────────────────────────────────────────────────

  if (!active && lines.length === 0) return null;

  const renderLines = () => {
    const elements: React.ReactNode[] = [];

    // Render finalized lines
    lines.forEach(line => {
      const start = getScreenPoint(line.start);
      const end = getScreenPoint(line.end);
      if (start && end) {
        elements.push(
          <line
            key={line.id}
            x1={start.x} y1={start.y}
            x2={end.x} y2={end.y}
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
            x1={start.x} y1={start.y}
            x2={end.x} y2={end.y}
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
    <svg
      ref={containerRef}
      className={`absolute inset-0 z-10 w-full h-full touch-none overflow-hidden transition-opacity duration-200 ${
        active ? 'opacity-100' : 'opacity-100'
      } ${
        isInteractionBlocked ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
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
      
      {active && (
        <g className="pointer-events-none select-none">
          {/* Main Feedback Banner */}
          <rect x="12" y="12" width="240" height="32" rx="6" fill="#1e222d" fillOpacity="0.9" stroke="#363a45" strokeWidth="1" />
          <circle cx="28" cy="28" r="4" fill={currentLine ? '#4361EE' : '#8b8fa8'} className={currentLine ? 'animate-pulse' : ''} />
          <text
            x="42"
            y="32"
            fill="white"
            className="text-[11px] font-bold uppercase tracking-wider"
          >
            {currentLine
              ? t('sim.terminal.drawing.instructions.finalizeLine')
              : t('sim.terminal.drawing.instructions.setStartPoint')}
          </text>

          {/* Helper Hints */}
          {!currentLine && (
            <text x="12" y="60" fill="#8b8fa8" className="text-[10px] font-medium italic opacity-80">
              {t('sim.terminal.drawing.instructions.escapeHint')}
            </text>
          )}
        </g>
      )}

      {/* Loading state if chart not ready */}
      {active && !isChartReady && (
        <g className="pointer-events-none">
          <rect x="12" y="72" width="260" height="24" rx="6" fill="black" fillOpacity="0.65" />
          <text x="50%" y="50%" textAnchor="middle" fill="white" className="text-xs font-bold uppercase tracking-widest animate-pulse">
            {t('sim.terminal.drawing.initializingChartInteraction')}
          </text>
        </g>
      )}
    </svg>
  );
}
