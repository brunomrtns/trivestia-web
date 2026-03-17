import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, HelpCircle, Play } from 'lucide-react';
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
  const tutorial = useTutorialProgress();

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

  // ─── Keyboard Shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
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
  }, [playback, engine]);

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

  // ─── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen max-h-screen flex-col gap-2 p-3 bg-background overflow-hidden">
      {/* Top: AccountSummary + Help button */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <AccountSummary
            engineState={engineState}
            initialBalance={initialBalance}
          />
        </div>
        <button
          onClick={handleOpenHelp}
          className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          title={t('sim.terminal.helpTitle')}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {t('sim.terminal.helpButton')}
        </button>
      </div>

      {/* Middle: Chart + Right panel */}
      <div className="flex min-h-0 flex-1 gap-2">
        {/* Chart + Onboarding overlay */}
        <div className="relative flex-1 min-w-0 min-h-0">
          <CandlesChart
            candles={candles}
            visibleCount={visibleCount}
            onTimeClick={engine.jumpToTimestamp}
            onUpdateProtection={engine.updateProtection}
            engineState={engineState}
          />

          {/* Paused overlay — prominent, on top of chart */}
          {isPaused && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <button
                onClick={playback.play}
                className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-primary/30 bg-background/90 px-6 py-4 shadow-2xl backdrop-blur-sm transition hover:border-primary/70 hover:scale-105 active:scale-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Play className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold">
                    {isPausedAtStart
                      ? t('sim.terminal.overlay.startTitle')
                      : t('sim.terminal.overlay.continueTitle')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isPausedAtStart
                      ? t('sim.terminal.overlay.startHint')
                      : t('sim.terminal.overlay.pausedHint', {
                          visible: visibleCount,
                          total: candles.length
                        })}
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Onboarding Tour */}
          {showOnboarding && !tutorial.completed && !tutorial.dismissed && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <OnboardingTour />
            </div>
          )}
        </div>

        {/* Right: OrderTicket + PositionPanel */}
        <div className="flex w-52 shrink-0 flex-col gap-2 overflow-y-auto">
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
        </div>
      </div>

      {/* Session Stats Panel */}
      <SessionStats engineState={engineState} initialBalance={initialBalance} />

      {/* Bottom tabs: Orders / Fills / Metrics */}
      <div className="flex shrink-0 flex-col gap-1.5 rounded-lg border bg-card">
        {/* Tab bar */}
        <div className="flex border-b">
          {(['orders', 'fills', 'metrics'] as BottomTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setBottomTab(tab)}
              className={`px-4 py-1.5 text-xs font-medium transition capitalize ${
                bottomTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
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

        {/* Tab content */}
        <div className="max-h-36 overflow-y-auto px-3 pb-2">
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
          {bottomTab === 'metrics' && <MetricsPanel result={engine.result} />}
        </div>
      </div>

      {/* Playback Controls */}
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
      />

      {/* Submit button when finished */}
      {engine.phase === 'FINISHED' && (
        <button
          onClick={engine.submit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {engine.phase === 'FINISHED' ? (
            t('sim.terminal.submitButton')
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('sim.terminal.submitting')}
            </>
          )}
        </button>
      )}
      {engine.phase === 'SUBMITTING' && (
        <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/50 py-2.5 text-sm font-semibold text-primary-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('sim.terminal.submitting')}
        </div>
      )}

      {/* Error toast */}
      {engine.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {engine.error}
        </div>
      )}

      {/* Help Drawer (internal — used when no external handler) */}
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
