import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time
} from 'lightweight-charts';
import { Maximize2 } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import type { Candle } from '@/types/api';
import { useAutoZoomTimeScale } from './useAutoZoomTimeScale';

interface CandlesChartProps {
  candles: Candle[];
  visibleCount: number;
}

export function CandlesChart({ candles, visibleCount }: CandlesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  /**
   * chart também fica em estado (além da ref) para que o hook
   * useAutoZoomTimeScale reaja via useEffect quando a instância
   * muda de null para o objeto criado.
   */
  const [chart, setChart] = useState<IChartApi | null>(null);

  // ─── Criação do chart (uma vez) ──────────────────────────────────────────

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
        /**
         * rightOffset: espaço visual (em larguras de barra) entre o último
         * candle e a borda direita do chart. Evita que a vela mais recente
         * fique encostada na borda.
         */
        rightOffset: 3,
        /**
         * fixRightEdge: impede que o usuário role para além do último candle
         * (sem espaço vazio à direita). Isso "gruda" o último candle na borda
         * direita e torna o scrollToRealTime() imediato e previsível.
         */
        fixRightEdge: true,
        /**
         * lockVisibleTimeRangeOnResize: ao redimensionar o container, mantém
         * o mesmo intervalo de tempo visível em vez de reajustar o zoom.
         * Evita saltos visuais ao abrir/fechar painéis laterais.
         */
        lockVisibleTimeRangeOnResize: true,
        /**
         * rightBarStaysOnScroll: comportamento nativo de "follow latest".
         * Enquanto o usuário estiver com o chart no extremo direito (última
         * barra visível), novos candles adicionados mantêm esse alinhamento
         * automaticamente. O hook ainda chama scrollToRealTime() para garantir
         * o posicionamento correto após setData().
         */
        rightBarStaysOnScroll: true
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
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

    chartRef.current = c;
    seriesRef.current = series;
    setChart(c);

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
      setChart(null);
    };
  }, []);

  // ─── Atualiza dados ───────────────────────────────────────────────────────
  //
  // NÃO chamamos scrollToRealTime aqui. O hook de auto-follow é responsável
  // pelo posicionamento, e sua ordem de declaração garante que esse effect
  // (setData) sempre rode antes do effect de follow do hook.

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const data: CandlestickData[] = candles.slice(0, visibleCount).map((c, i) => ({
      // c.time está em ms; lightweight-charts precisa de segundos ascendentes.
      // Fallback sintético caso time seja falsy/NaN (ex: candle sem startTimestamp).
      time: (c.time
        ? Math.floor(c.time / 1000)
        : 1_700_000_000 + i * 60) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    seriesRef.current.setData(data);
  }, [candles, visibleCount]);

  // ─── Hook de auto-follow ─────────────────────────────────────────────────
  //
  // Declarado após os effects acima. React garante ordem de execução:
  //   1. setData  (effect acima)
  //   2. zoom inicial / scrollToRealTime  (effects do hook)

  const { autoFollowEnabled, resetAutoFollow } = useAutoZoomTimeScale(
    chart,
    containerRef,
    { visibleCount }
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <TooltipPrimitive.Provider delayDuration={400}>
      <div className="relative h-full w-full">
        {/* Canvas do chart */}
        <div
          ref={containerRef}
          className="h-full w-full rounded-lg overflow-hidden"
        />

        {/* Botão de reativar auto-follow — canto superior direito */}
        <div className="absolute right-2 top-2 z-10">
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
              <button
                onClick={resetAutoFollow}
                aria-label={
                  autoFollowEnabled
                    ? 'Acompanhamento automático ativo'
                    : 'Reativar acompanhamento automático'
                }
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                  'bg-background/80 backdrop-blur-sm',
                  autoFollowEnabled
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-white/10 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary'
                )}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </TooltipPrimitive.Trigger>

            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content
                side="left"
                sideOffset={6}
                className={cn(
                  'z-50 rounded-md px-2.5 py-1 text-xs shadow-md',
                  'bg-popover text-popover-foreground',
                  'animate-in fade-in-0 zoom-in-95',
                  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
                )}
              >
                {autoFollowEnabled
                  ? 'Acompanhamento automático ativo'
                  : 'Reativar acompanhamento automático'}
                <TooltipPrimitive.Arrow className="fill-popover" />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>
        </div>
      </div>
    </TooltipPrimitive.Provider>
  );
}
