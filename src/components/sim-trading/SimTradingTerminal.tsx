import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  HelpCircle,
  Play,
  ChevronLeft,
  LayoutGrid
} from 'lucide-react';
import { useSimEngine } from './useSimEngine';
import { usePlayback } from './usePlayback';
import { CandlesChart } from './CandlesChart';
import { OrderTicket } from './OrderTicket';
import { PositionPanel } from './PositionPanel';
import { OrdersPanel } from './OrdersPanel';
import { FillsPanel } from './FillsPanel';
import { AccountSummary } from './AccountSummary';
import { MetricsPanel } from './MetricsPanel';
import { PlaybackControls } from './PlaybackControls';
import { SessionStats } from './SessionStats';
import { ResultScreen } from './ResultScreen';
import { ScenarioLoader } from './ScenarioLoader';
import { HelpDrawer } from './HelpDrawer';
import { OnboardingTour } from './OnboardingTour';
import { useTutorialProgress } from './useTutorialProgress';
import { TerminalSidebar } from './TerminalSidebar';
import { DrawingOverlay } from './DrawingOverlay';
import { SearchOverlay } from './SearchOverlay';
import { IndicatorsPanel } from './IndicatorsPanel';
import { useIndicators } from './useIndicators';
import { toast } from 'sonner';
import type { Candle, ScenarioPayload, OrderRequest } from '@/types/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SimTradingTerminalProps {
  slug: string;
  mode: 'CHALLENGE' | 'PRACTICE';
  activityId?: string; // CHALLENGE
  practiceToken?: string; // PRACTICE
  practiceCandles?: Candle[]; // PRACTICE
  practiceScenario?: ScenarioPayload; // PRACTICE
  onComplete?: () => void;
  onOpenHelp?: () => void;
  showOnboarding?: boolean;
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type BottomTab = 'orders' | 'fills' | 'metrics';
type ActivePanel = 'none' | 'search' | 'indicators';

// ─── Component ────────────────────────────────────────────────────────────────

export function SimTradingTerminal({
  slug,
  mode,
  activityId,
  practiceToken,
  practiceCandles,
  practiceScenario,
  onComplete,
  onOpenHelp: externalHelpOpen,
  showOnboarding = true
}: SimTradingTerminalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bottomTab, setBottomTab] = useState<BottomTab>('orders');
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('cursor');
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [drawingInProgress, setDrawingInProgress] = useState(false);
  const [chartApi, setChartApi] = useState<any>(null);
  const [mainSeries, setMainSeries] = useState<any>(null);
  const tutorial = useTutorialProgress();

  const handleChartLoad = useCallback(
    (chart: any | null, series: any | null) => {
      setChartApi(chart);
      setMainSeries(series);
    },
    []
  );

  const handleToolChange = useCallback(
    (toolId: string) => {
      // 1. Determine if the tool is a 'Panel' (ephemeral UI) or a 'Mode' (interaction state)
      const isPanel = ['search', 'indicators'].includes(toolId);

      if (isPanel) {
        // Toggle panel without losing current interaction mode
        setActivePanel((prev) =>
          prev === toolId ? 'none' : (toolId as ActivePanel)
        );
        console.log(`[Terminal] Panel toggled: ${toolId}`);
      } else {
        // Switch interaction mode and close any open panels
        setActiveTool(toolId);
        setActivePanel('none');
        console.log(`[Terminal] Mode selected: ${toolId}`);
      }
    },
    [t]
  );

  // Update cursor based on active tool
  useEffect(() => {
    const cursorMap: Record<string, string> = {
      cursor: 'default',
      drawings: 'crosshair',
      replay: 'copy', // Using 'copy' or 'crosshair' for replay selection feel
      indicators: 'default',
      search: 'text'
    };

    const newCursor = cursorMap[activeTool] || 'default';
    document.body.style.cursor = newCursor;

    return () => {
      document.body.style.cursor = 'default';
    };
  }, [activeTool]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  const handleOpenHelp = useCallback(() => {
    if (externalHelpOpen) {
      externalHelpOpen();
    } else {
      setHelpOpen(true);
    }
  }, [externalHelpOpen]);

  const engine = useSimEngine({
    slug,
    mode,
    activityId,
    practiceToken,
    practiceCandles,
    practiceScenario,
    onComplete: handleComplete
  });

  const playback = usePlayback({
    onAdvance: engine.advanceCandle,
    onRewind: engine.stepBack,
    isFinished: engine.phase === 'FINISHED' || engine.phase === 'RESULT'
  });

  // Indicators Logic
  const indicators = useIndicators(engine.candles);

  // ─── Keyboard Shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        if (e.code === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      switch (e.code) {
        case 'Escape':
          // Drawing cancellation has priority over panel closing / mode exit.
          if (activeTool === 'drawings' && drawingInProgress) {
            e.preventDefault();
            return;
          }

          if (activePanel !== 'none') {
            e.preventDefault();
            setActivePanel('none');
          } else if (activeTool !== 'cursor') {
            e.preventDefault();
            setActiveTool('cursor');
          }
          break;
        case 'Space':
          if (activeTool === 'drawings') {
            return;
          }
          e.preventDefault();
          playback.playing ? playback.pause() : playback.play();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            engine.jumpForwardSteps(10);
          } else {
            playback.stepForward();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            engine.jumpBackwardSteps(10);
          } else {
            playback.stepBackward();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playback, engine, activePanel, activeTool, drawingInProgress]);

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (engine.phase === 'LOADING') {
    return <ScenarioLoader error={null} />;
  }

  if (engine.phase === 'RESULT' && engine.result) {
    return (
      <ResultScreen
        mode={mode}
        result={engine.result}
        submitResult={engine.submitResult}
        onRetry={
          mode === 'CHALLENGE' && activityId
            ? () => window.location.reload()
            : undefined
        }
        onGoHome={() =>
          mode === 'PRACTICE' ? navigate('/app/lab') : navigate(-1)
        }
      />
    );
  }

  if (
    engine.error &&
    engine.phase !== 'PLAYING' &&
    engine.phase !== 'PAUSED' &&
    engine.phase !== 'READY'
  ) {
    return <ScenarioLoader error={engine.error} />;
  }

  // ─── Waiting for scenario data ───────────────────────────────────────────────

  if (!engine.engineState || !engine.scenario || engine.candles.length === 0) {
    if (engine.error) return <ScenarioLoader error={engine.error} />;
    return <ScenarioLoader error={null} />;
  }

  const { engineState, scenario, candles, visibleCount } = engine;
  const initialBalance = scenario.executionConfig.initialBalance;
  const currentCandle = candles[visibleCount - 1];
  const currentPrice = currentCandle?.close;

  // ─── FINISHED: show submit button ──────────────────────────────────────────

  const isFinished =
    engine.phase === 'FINISHED' || engine.phase === 'SUBMITTING';

  const isPausedAtStart =
    !playback.playing && !isFinished && engine.phase === 'READY';
  const isPaused = !playback.playing && !isFinished;
  const isReadyPhase = engine.phase === 'READY';
  const showPlaybackControls = [
    'READY',
    'PAUSED',
    'PLAYING',
    'FINISHED',
    'SUBMITTING'
  ].includes(engine.phase);

  // ─── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full bg-background overflow-hidden text-foreground antialiased selection:bg-primary/30">
      {/* 1. LEFT SIDEBAR (Tools) */}
      <TerminalSidebar
        activeTool={activeTool}
        onToolChange={handleToolChange}
      />

      {/* 2. CENTER (Chart Area) */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-background">
        <div className="relative flex-1 min-w-0 min-h-0">
          <CandlesChart
            candles={candles}
            visibleCount={visibleCount}
            onTimeClick={engine.jumpToTimestamp}
            onUpdateProtection={engine.updateProtection}
            onChartLoad={handleChartLoad}
            engineState={engineState}
            maSeries={indicators.maSeries}
            emaSeries={indicators.emaSeries}
            rsiSeries={indicators.rsiSeries}
          />

          {/* Tool Overlays */}
          <DrawingOverlay
            active={activeTool === 'drawings'}
            chart={chartApi}
            series={mainSeries}
            onDrawingStateChange={setDrawingInProgress}
          />

          {/* Replay Selection Mode Banner */}
          {activeTool === 'replay' && engine.phase === 'READY' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-4 py-2 shadow-xl backdrop-blur-md">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                  {t('sim.terminal.replayBanner.title')}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t('sim.terminal.replayBanner.hint')}
                </span>
              </div>
            </div>
          )}

          {activePanel === 'search' && (
            <SearchOverlay
              onClose={() => setActivePanel('none')}
              onSearch={(symbol) => {
                console.log(`[Terminal] Symbol search: ${symbol}`);
                toast.success(
                  t('sim.terminal.searchChangedSymbol', { symbol })
                );
              }}
            />
          )}

          {activePanel === 'indicators' && (
            <IndicatorsPanel
              onClose={() => setActivePanel('none')}
              activeIndicators={{
                ma: indicators.state.ma.enabled,
                ema: indicators.state.ema.enabled,
                rsi: indicators.state.rsi.enabled
              }}
              onToggle={(id) => {
                if (id === 'ma') indicators.toggleMA();
                if (id === 'ema') indicators.toggleEMA();
                if (id === 'rsi') indicators.toggleRSI();
              }}
            />
          )}

          {/* Floating Playback Controls (bottom-center) - Session shell controls, independent from replay tool */}
          {showPlaybackControls && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 z-30 w-full px-4 pointer-events-none animate-in slide-in-from-bottom-4 duration-300 ${
                isReadyPhase ? 'bottom-4 max-w-xl' : 'bottom-6 max-w-2xl'
              }`}
            >
              <div className="pointer-events-auto">
                {/* Subtle Paused Status (replaces giant centered overlay) */}
                {isPaused && !isFinished && !isPausedAtStart && (
                  <div className="mb-2 flex justify-center animate-in fade-in slide-in-from-bottom-1 duration-500">
                    <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80 backdrop-blur-sm">
                      {t('sim.terminal.playbackPaused')}
                    </div>
                  </div>
                )}

                <PlaybackControls
                  playing={playback.playing}
                  speed={playback.speed}
                  visibleCount={visibleCount}
                  totalCandles={candles.length}
                  candles={candles}
                  isFinished={isFinished}
                  isLoading={engine.phase === 'SUBMITTING'}
                  onPlay={playback.play}
                  onPause={playback.pause}
                  onStepForward={playback.stepForward}
                  onStepBackward={playback.stepBackward}
                  onJumpTo={engine.jumpTo}
                  onSkipToEnd={engine.skipToEnd}
                  onSetSpeed={playback.setSpeed}
                  floating
                />
              </div>
            </div>
          )}

          {/* Onboarding Tour */}
          {showOnboarding && !tutorial.completed && !tutorial.dismissed && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <OnboardingTour />
            </div>
          )}
        </div>
      </main>

      {/* 3. RIGHT PANEL (Trading / Info) */}
      <aside className="w-[320px] shrink-0 border-l border-border bg-card flex flex-col min-h-0 overflow-hidden">
        {/* Account Info Section */}
        <div className="p-3 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5" />
              {t('sim.terminal.accountTerminal')}
            </h2>
            <button
              onClick={handleOpenHelp}
              className="text-muted-foreground hover:text-foreground transition"
              title={t('sim.terminal.helpTitle')}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <AccountSummary
            engineState={engineState}
            initialBalance={initialBalance}
          />
        </div>

        {/* Action Panel (Order + Position) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <OrderTicket
            onPlaceOrder={(order) =>
              engine.placeOrder(order as Omit<OrderRequest, 'candleIndex'>)
            }
            disabled={isFinished}
            currentPrice={currentPrice}
          />

          <PositionPanel
            position={engineState.position}
            onClose={engine.closePosition}
            disabled={isFinished}
          />

          <SessionStats
            engineState={engineState}
            initialBalance={initialBalance}
          />

          {/* Data Tabs (Orders, Fills, Metrics) */}
          <div className="rounded-lg border border-border bg-background overflow-hidden flex flex-col">
            <div className="flex border-b border-border bg-muted/30">
              {(['orders', 'fills', 'metrics'] as BottomTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab)}
                  className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition capitalize ${
                    bottomTab === tab
                      ? 'bg-background text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {tab === 'orders'
                    ? t('sim.terminal.tabs.orders')
                    : tab === 'fills'
                      ? t('sim.terminal.tabs.fills')
                      : t('sim.terminal.tabs.metrics')}
                </button>
              ))}
            </div>
            <div className="max-h-64 overflow-y-auto p-2 min-h-[120px]">
              {bottomTab === 'orders' && (
                <OrdersPanel
                  engineState={engineState}
                  onCancel={engine.cancelOrder}
                  disabled={isFinished}
                />
              )}
              {bottomTab === 'fills' && (
                <FillsPanel fills={engineState.fills ?? []} />
              )}
              {bottomTab === 'metrics' && (
                <MetricsPanel result={engine.result} />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Submit Button */}
        <div className="p-4 border-t border-border bg-card">
          {engine.phase === 'FINISHED' || engine.phase === 'SUBMITTING' ? (
            <button
              onClick={engine.submit}
              disabled={engine.phase === 'SUBMITTING'}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {engine.phase === 'SUBMITTING' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('sim.terminal.submitting')}
                </>
              ) : (
                t('sim.terminal.submitButton')
              )}
            </button>
          ) : (
            <div className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-widest">
              {t('sim.terminal.liveSessionActive')}
            </div>
          )}
        </div>
      </aside>

      {/* Error toast */}
      {engine.error && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {engine.error}
        </div>
      )}

      {/* Help Drawer */}
      {!externalHelpOpen && (
        <HelpDrawer
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          onRestartTutorial={tutorial.restart}
        />
      )}
    </div>
  );
}
