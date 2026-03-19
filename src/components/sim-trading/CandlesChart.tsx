import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time,
  type IPriceLine,
  type SeriesMarker
} from 'lightweight-charts';
import { Maximize2 } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import type { Candle, SimulationState } from '@/types/api';
import type { IndicatorSeries } from './useIndicators';
import { useAutoZoomTimeScale } from './useAutoZoomTimeScale';
import { toast } from 'sonner';

interface CandlesChartProps {
  candles: Candle[];
  visibleCount: number;
  maSeries?: IndicatorSeries | null;
  emaSeries?: IndicatorSeries | null;
  rsiSeries?: number[] | null;
  onTimeClick?: (timestamp: number) => void;
  onUpdateProtection?: (sl?: number, tp?: number) => void;
  onChartLoad?: (chart: IChartApi | null, series: ISeriesApi<'Candlestick'> | null) => void;
  engineState?: SimulationState | null;
}

export function CandlesChart({
  candles,
  visibleCount,
  maSeries,
  emaSeries,
  rsiSeries,
  onTimeClick,
  onUpdateProtection,
  onChartLoad,
  engineState
}: CandlesChartProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const pathsSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const priceLinesRef = useRef<{
    SL?: IPriceLine;
    TP?: IPriceLine;
    ENTRY?: IPriceLine;
    PENDING: IPriceLine[];
  }>({ PENDING: [] });

  const draggingRef = useRef<{
    type: 'SL' | 'TP';
    line: IPriceLine;
  } | null>(null);

  const [chart, setChart] = useState<IChartApi | null>(null);

  // ─── Inicialização do Chart ────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    const c = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'hsl(224 71% 4%)' },
        textColor: 'hsl(215 20% 65%)'
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' }
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      leftPriceScale: {
        visible: true,
        borderColor: 'rgba(255,255,255,0.1)',
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    });

    const series = c.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350'
    });

    const pathsSeries = c.addSeries(LineSeries, {
      color: 'rgba(255, 255, 255, 0.3)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false
    });

    chartRef.current = c;
    seriesRef.current = series as any;
    pathsSeriesRef.current = pathsSeries as any;
    setChart(c);

    if (onChartLoad) {
      console.log('[CandlesChart] onChartLoad(create)', {
        hasChart: !!c,
        hasSeries: !!series,
      });
      onChartLoad(c, series as any);
    }

    c.subscribeClick((param) => {
      if (!param.time || !onTimeClick) return;
      onTimeClick((param.time as number) * 1000);
    });

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        c.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      c.remove();
      chartRef.current = null;
      seriesRef.current = null;
      maSeriesRef.current = null;
      emaSeriesRef.current = null;
      rsiSeriesRef.current = null;
      pathsSeriesRef.current = null;
      setChart(null);
      if (onChartLoad) {
        console.log('[CandlesChart] onChartLoad(cleanup)', {
          hasChart: false,
          hasSeries: false,
        });
        onChartLoad(null, null);
      }
    };
  }, [onChartLoad]);

  useEffect(() => {
    if (!onChartLoad || !chartRef.current || !seriesRef.current) return;
    console.log('[CandlesChart] onChartLoad(sync)', {
      hasChart: !!chartRef.current,
      hasSeries: !!seriesRef.current,
    });
    onChartLoad(chartRef.current, seriesRef.current as any);
  }, [onChartLoad, chart]);

  // ─── Atualização de Dados (Candles) ────────────────────────────────────────

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const data: CandlestickData[] = candles
      .slice(0, visibleCount)
      .map((c, i) => ({
        time: (c.time ? Math.floor(c.time / 1000) : 1_700_000_000 + i * 60) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      }));

    seriesRef.current.setData(data);
  }, [candles, visibleCount]);

  // ─── Atualização de Indicadores ────────────────────────────────────────────

  useEffect(() => {
    const c = chartRef.current;
    if (!c) return;

    const times = candles
      .slice(0, visibleCount)
      .map((cd, i) => (cd.time ? Math.floor(cd.time / 1000) : 1_700_000_000 + i * 60) as Time);

    if (maSeries) {
      const maLineSeries = maSeriesRef.current ?? (c.addSeries(LineSeries, {
          color: maSeries.color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        }) as any);
      maSeriesRef.current = maLineSeries;
      maLineSeries.applyOptions({ color: maSeries.color });
      const maData: LineData[] = maSeries.values
        .slice(0, visibleCount)
        .map((v, i) => ({ time: times[i], value: v }))
        .filter((p) => !isNaN(p.value));
      maLineSeries.setData(maData);
    } else if (maSeriesRef.current) {
      c.removeSeries(maSeriesRef.current);
      maSeriesRef.current = null;
    }

    if (emaSeries) {
      const emaLineSeries = emaSeriesRef.current ?? (c.addSeries(LineSeries, {
          color: emaSeries.color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        }) as any);
      emaSeriesRef.current = emaLineSeries;
      emaLineSeries.applyOptions({ color: emaSeries.color });
      const emaData: LineData[] = emaSeries.values
        .slice(0, visibleCount)
        .map((v, i) => ({ time: times[i], value: v }))
        .filter((p) => !isNaN(p.value));
      emaLineSeries.setData(emaData);
    } else if (emaSeriesRef.current) {
      c.removeSeries(emaSeriesRef.current);
      emaSeriesRef.current = null;
    }

    if (rsiSeries) {
      const isNewRsiSeries = !rsiSeriesRef.current;
      const rsiLineSeries = rsiSeriesRef.current ?? (c.addSeries(LineSeries, {
        color: '#60a5fa',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: 'left'
      }, 1) as any);
      rsiSeriesRef.current = rsiLineSeries;
      if (isNewRsiSeries) {
        c.priceScale('left').applyOptions({ 
          scaleMargins: { top: 0.8, bottom: 0.05 },
          visible: true
        });
      }
      const rsiData: LineData[] = rsiSeries
        .slice(0, visibleCount)
        .map((v, i) => ({ time: times[i], value: v }))
        .filter((p) => !isNaN(p.value));
      rsiLineSeries.setData(rsiData);
    } else if (rsiSeriesRef.current) {
      c.removeSeries(rsiSeriesRef.current);
      rsiSeriesRef.current = null;
      // Optionally hide left scale if no other series uses it
      c.priceScale('left').applyOptions({ visible: false });
    }
  }, [candles, visibleCount, maSeries, emaSeries, rsiSeries]);

  // ─── Visual Trading: Markers, Paths, Entry, SL, TP ─────────────────────────

  useEffect(() => {
    const series = seriesRef.current;
    const pathSeries = pathsSeriesRef.current;
    if (!series || !engineState || !pathSeries || !chart) return;

    // 1. Limpar Linhas Anteriores
    if (priceLinesRef.current.SL) series.removePriceLine(priceLinesRef.current.SL);
    if (priceLinesRef.current.TP) series.removePriceLine(priceLinesRef.current.TP);
    if (priceLinesRef.current.ENTRY) series.removePriceLine(priceLinesRef.current.ENTRY);
    priceLinesRef.current.PENDING.forEach((line) => series.removePriceLine(line));
    priceLinesRef.current = { PENDING: [] };

    const { position, openOrders, fills } = engineState;

    // 2. Markers (Sinalização de Trades) e Paths (Trajeto)
    const markers: SeriesMarker<Time>[] = [];
    const pathData: LineData[] = [];

    fills.forEach((fill) => {
      const time = (candles[fill.candleIndex]?.time
        ? Math.floor(candles[fill.candleIndex].time / 1000)
        : 1_700_000_000 + fill.candleIndex * 60) as Time;

      const isEntry = fill.reason === 'MARKET' || fill.reason === 'LIMIT' || fill.reason === 'STOP';

      markers.push({
        time,
        position: fill.side === 'BUY' ? 'belowBar' : 'aboveBar',
        color: fill.side === 'BUY' ? '#10b981' : '#ef4444',
        shape: fill.side === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: fill.reason
      });

      pathData.push({ time, value: fill.fillPrice });
    });

    // Marcador do Candle Atual (Replay Highlight)
    if (visibleCount > 0) {
      const lastCandle = candles[visibleCount - 1];
      const currentTime = (lastCandle?.time ? Math.floor(lastCandle.time / 1000) : 0) as Time;
      if (currentTime) {
        markers.push({
          time: currentTime,
          position: 'aboveBar',
          color: '#3b82f6',
          shape: 'circle',
          size: 0.1
        });
      }
    }

    if (typeof (series as any).setMarkers === 'function') {
      (series as any).setMarkers(markers);
    }
    pathSeries.setData(pathData);

    // 3. Linha de Entrada com PnL Dinâmico
    if (position && position.side !== 'FLAT') {
      const pnl = position.unrealizedPnl;
      const pnlStr = `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`;
      
      const entryLine = series.createPriceLine({
        price: position.entryPrice,
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `ENTRY (${position.side}) PnL: ${pnlStr}`
      });
      priceLinesRef.current.ENTRY = entryLine;

      // 4. Linhas de SL e TP (Active protections)
      const sltps = (engineState as any).activeSlTps || [];
      sltps.forEach((sltp: any) => {
        if (sltp.sl !== undefined) {
          priceLinesRef.current.SL = series.createPriceLine({
            price: sltp.sl,
            color: '#ef4444',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'SL'
          });
        }
        if (sltp.tp !== undefined) {
          priceLinesRef.current.TP = series.createPriceLine({
            price: sltp.tp,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'TP'
          });
        }
      });
    }

    // 5. Linhas de Ordens Pendentes
    if (openOrders && openOrders.length > 0) {
      openOrders.forEach((order) => {
        if (order.price !== undefined) {
          priceLinesRef.current.PENDING.push(series.createPriceLine({
            price: order.price,
            color: '#f59e0b',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `${order.type} ${order.side}`
          }));
        }
      });
    }
  }, [engineState, candles, visibleCount, chart]);

  // ─── Arraste Interativo de SL/TP ───────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    const c = chart;
    const series = seriesRef.current;
    if (!container || !c || !series || !onUpdateProtection) return;

    const handleMouseDown = (e: MouseEvent) => {
      const { SL, TP } = priceLinesRef.current;
      if (!SL && !TP) return;

      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      
      const checkGrab = (line: IPriceLine, type: 'SL' | 'TP') => {
        const linePrice = line.options().price;
        const lineY = series.priceToCoordinate(linePrice);
        if (lineY !== null && Math.abs(lineY - y) < 15) {
          draggingRef.current = { type, line };
          c.applyOptions({ handleScroll: false, handleScale: false });
          return true;
        }
        return false;
      };

      if (SL && checkGrab(SL, 'SL')) return;
      if (TP && checkGrab(TP, 'TP')) return;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = series.coordinateToPrice(y);
      if (price !== null) draggingRef.current.line.applyOptions({ price });
    };

    const handleMouseUp = () => {
      if (!draggingRef.current || !engineState) return;
      const { type, line } = draggingRef.current;
      const newPrice = line.options().price;
      const pos = engineState.position;

      let isValid = true;
      if (pos.side === 'LONG') {
        if (type === 'SL' && newPrice >= pos.entryPrice) isValid = false;
        if (type === 'TP' && newPrice <= pos.entryPrice) isValid = false;
      } else if (pos.side === 'SHORT') {
        if (type === 'SL' && newPrice <= pos.entryPrice) isValid = false;
        if (type === 'TP' && newPrice >= pos.entryPrice) isValid = false;
      }

      if (isValid) {
        if (type === 'SL') onUpdateProtection(newPrice, undefined);
        if (type === 'TP') onUpdateProtection(undefined, newPrice);
      } else {
        toast.error(t('sim.chart.invalidProtection'));
      }
      draggingRef.current = null;
      c.applyOptions({ handleScroll: true, handleScale: true });
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [chart, onUpdateProtection, engineState, t]);

  // ─── Auto-follow Hook ──────────────────────────────────────────────────────

  const { autoFollowEnabled, resetAutoFollow } = useAutoZoomTimeScale(chart, containerRef, { visibleCount });

  return (
    <TooltipPrimitive.Provider delayDuration={400}>
      <div className="relative h-full w-full">
        <div ref={containerRef} className="h-full w-full rounded-lg overflow-hidden" />
        <div className="absolute right-2 top-2 z-10">
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
              <button
                onClick={resetAutoFollow}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                  'bg-background/80 backdrop-blur-sm',
                  autoFollowEnabled ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground'
                )}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content side="left" className="z-50 rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md">
                {autoFollowEnabled ? t('sim.candles.autoFollow.active') : t('sim.candles.autoFollow.reactivate')}
                <TooltipPrimitive.Arrow className="fill-popover" />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>
        </div>
      </div>
    </TooltipPrimitive.Provider>
  );
}
