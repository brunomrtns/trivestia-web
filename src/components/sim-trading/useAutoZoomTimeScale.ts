/**
 * useAutoZoomTimeScale
 * ─────────────────────────────────────────────────────────────────────────────
 * Gerencia "auto-follow" (seguir o último candle) no time scale do
 * lightweight-charts v5.
 *
 * ESTRATÉGIA
 * ──────────
 * 1. Zoom inicial (uma só vez): fitContent se ≤ TARGET_BARS, senão
 *    setVisibleLogicalRange para mostrar os últimos TARGET_BARS candles.
 *
 * 2. Follow durante playback: apenas scrollToRealTime() por update.
 *    Simples e estável — não altera barSpacing nem setVisibleLogicalRange
 *    em loop.
 *
 * 3. As opções nativas do timeScale (rightBarStaysOnScroll, fixRightEdge etc.)
 *    configuradas no createChart fazem a maior parte do trabalho de "grudar
 *    na borda direita"; este hook complementa com o estado da UI (botão).
 *
 * ANTI-LOOP PROGRAMÁTICO
 * ──────────────────────
 * Antes de toda chamada ao timeScale (fitContent / setVisibleLogicalRange /
 * scrollToRealTime), setamos isProgrammaticRef = true. O handler de
 * subscribeVisibleLogicalRangeChange verifica esse flag e ignora eventos
 * causados por nós. Após a chamada, resetamos via requestAnimationFrame
 * (o handler é síncrono dentro do lightweight-charts, logo já terá sido
 * ignorado antes do rAF disparar).
 *
 * DETECÇÃO DE INTERAÇÃO DO USUÁRIO
 * ─────────────────────────────────
 * - subscribeVisibleLogicalRangeChange: cobre pan, zoom por drag e programático.
 * - listener "wheel": detecção preemptiva antes do range mudar (wheel zoom).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { IChartApi } from 'lightweight-charts';

/** Janela de candles a mostrar quando o total exceder esse valor. */
const TARGET_BARS = 80;

interface Options {
  visibleCount: number;
}

interface Result {
  autoFollowEnabled: boolean;
  resetAutoFollow: () => void;
}

export function useAutoZoomTimeScale(
  chart: IChartApi | null,
  containerRef: React.RefObject<HTMLDivElement | null>,
  { visibleCount }: Options
): Result {
  const [autoFollowEnabled, setAutoFollowEnabled] = useState(true);

  /** Flag que marca mudanças de range causadas por nós (não pelo usuário). */
  const isProgrammaticRef = useRef(false);

  /**
   * Verdadeiro após o zoom inicial ter sido aplicado.
   * Evita re-aplicar fitContent/setVisibleLogicalRange a cada update de candle.
   */
  const initialZoomDoneRef = useRef(false);

  // ─── Utilitário: envolve uma chamada ao timeScale marcando-a como programática
  const programmaticCall = useCallback((fn: () => void) => {
    isProgrammaticRef.current = true;
    fn();
    // lightweight-charts dispara subscribeVisibleLogicalRangeChange de forma
    // síncrona, portanto o handler já será ignorado antes do rAF disparar.
    requestAnimationFrame(() => {
      isProgrammaticRef.current = false;
    });
  }, []);

  // ─── Zoom inicial ── feito UMA vez quando o chart e os primeiros candles chegam
  useEffect(() => {
    if (!chart || visibleCount === 0 || initialZoomDoneRef.current) return;

    programmaticCall(() => {
      if (visibleCount <= TARGET_BARS) {
        // Poucos candles: mostrar tudo.
        chart.timeScale().fitContent();
      } else {
        // Muitos candles: mostrar apenas os últimos TARGET_BARS.
        chart.timeScale().setVisibleLogicalRange({
          from: visibleCount - TARGET_BARS - 0.5,
          to: visibleCount - 0.5
        });
      }
    });

    initialZoomDoneRef.current = true;
  }, [chart, visibleCount, programmaticCall]);

  // ─── Follow durante playback ── só scrollToRealTime, sem alterar range/zoom
  useEffect(() => {
    if (
      !chart ||
      !autoFollowEnabled ||
      !initialZoomDoneRef.current ||
      visibleCount === 0
    )
      return;

    programmaticCall(() => {
      chart.timeScale().scrollToRealTime();
    });
  }, [chart, autoFollowEnabled, visibleCount, programmaticCall]);

  // ─── Detecta interação manual via range change ────────────────────────────
  useEffect(() => {
    if (!chart) return;

    const handler = () => {
      if (isProgrammaticRef.current) return; // mudança nossa: ignorar
      setAutoFollowEnabled(false);
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handler);
    return () =>
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
  }, [chart]);

  // ─── Fallback: wheel (detecção preemptiva antes do range event) ───────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = () => {
      if (isProgrammaticRef.current) return;
      setAutoFollowEnabled(false);
    };

    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, [containerRef]);

  // ─── Reset público (botão) ────────────────────────────────────────────────
  const resetAutoFollow = useCallback(() => {
    if (!chart) return;
    // Volta para a borda direita imediatamente.
    programmaticCall(() => chart.timeScale().scrollToRealTime());
    // Religa o follow; o effect de follow acima rodará novamente no próximo
    // visibleCount, mas a posição já estará correta desde agora.
    setAutoFollowEnabled(true);
  }, [chart, programmaticCall]);

  return { autoFollowEnabled, resetAutoFollow };
}
