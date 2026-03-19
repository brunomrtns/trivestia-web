import {
  Play,
  Pause,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  ChevronsUpDown,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PlaybackSpeed } from './usePlayback';
import type { Candle } from '@/types/api';

const SPEEDS: { value: PlaybackSpeed; label: string }[] = [
  { value: 1000, label: '1×' },
  { value: 500, label: '2×' },
  { value: 200, label: '5×' },
  { value: 100, label: '10×' },
  { value: 40, label: '25×' }
];

interface PlaybackControlsProps {
  playing: boolean;
  speed: PlaybackSpeed;
  visibleCount: number;
  totalCandles: number;
  candles: Candle[];
  isFinished: boolean;
  isLoading?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward?: () => void;
  onJumpTo?: (index: number) => void;
  onSkipToEnd: () => void;
  onSetSpeed: (s: PlaybackSpeed) => void;
  floating?: boolean;
}

export function PlaybackControls({
  playing,
  speed,
  visibleCount,
  totalCandles,
  candles,
  isFinished,
  isLoading,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onJumpTo,
  onSkipToEnd,
  onSetSpeed,
  floating
}: PlaybackControlsProps) {
  const { t } = useTranslation();
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(false);

  const disabled = isFinished || isLoading;
  const isPausedAtStart =
    !playing && !isFinished && !isLoading && visibleCount === 1;
  const isPaused = !playing && !isFinished && !isLoading;
  const isExpanded = floating ? isPinnedExpanded : false;

  const currentCandle = candles[visibleCount - 1];
  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];

  const formatDate = (ms?: number) => {
    if (!ms) return '--/--';
    return new Date(ms).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (floating) {
    if (!isExpanded) {
      return (
        <div
          className={cn(
            'relative flex items-center gap-2 rounded-full border border-border/60 bg-background/85 pl-2 pr-9 py-1.5 shadow-xl backdrop-blur-md transition-all duration-200',
            isPausedAtStart && 'border-primary/40 ring-1 ring-primary/20'
          )}
        >
          <button
            onClick={() => {
              if (playing) {
                onPause();
                return;
              }

              onPlay();
              setIsPinnedExpanded(true);
            }}
            disabled={disabled}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-all',
              isPaused && !disabled
                ? 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'
                : 'text-foreground hover:bg-muted disabled:opacity-40'
            )}
            title={playing ? t('sim.playback.pauseTitle') : t('sim.playback.playTitle')}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : playing ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 ml-0.5 fill-current" />
            )}
          </button>

          <span className="pr-1 text-[10px] font-bold text-muted-foreground">
            {visibleCount}/{totalCandles}
          </span>

          <button
            onClick={() => setIsPinnedExpanded(true)}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"
            title={t('sim.terminal.playbackAnchor.expand')}
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'relative rounded-2xl border border-border/50 bg-background/80 backdrop-blur-md shadow-2xl transition-all duration-300',
          isPausedAtStart && 'border-primary/40 ring-1 ring-primary/20'
        )}
      >
        <button
          onClick={() => {
            setIsPinnedExpanded(false);
          }}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background"
          title={t('sim.terminal.playbackAnchor.collapse')}
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </button>

        <div className="px-3 pb-3 pt-10">
          {/* Timeline Slider */}
          <div className="flex items-center gap-3 px-1">
            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap min-w-[70px]">
              {formatDate(currentCandle?.time)}
            </span>
            <input
              type="range"
              min="1"
              max={totalCandles}
              value={visibleCount}
              onChange={(e) => onJumpTo?.(parseInt(e.target.value))}
              disabled={isLoading}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary focus:outline-none"
            />
            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap min-w-[30px] text-right">
              {visibleCount}/{totalCandles}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-4">
            {/* Main Controls Group */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              <button
                onClick={onStepBackward}
                disabled={isLoading || visibleCount <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-background text-muted-foreground disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={playing ? onPause : onPlay}
                disabled={disabled}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-all shadow-sm',
                  isPaused && !disabled
                    ? 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'
                    : 'hover:bg-background text-foreground disabled:opacity-40'
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : playing ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5 fill-current" />
                )}
              </button>

              <button
                onClick={onStepForward}
                disabled={disabled}
                className="flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-background text-muted-foreground disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={onSkipToEnd}
                disabled={disabled}
                className="flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-background text-muted-foreground disabled:opacity-30"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            <div className="h-8 w-px bg-border/50" />

            {/* Speed selector */}
            <div className="flex items-center gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onSetSpeed(s.value)}
                  className={cn(
                    'h-7 px-2 rounded-md text-[10px] font-bold transition-all',
                    speed === s.value
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Status info */}
            <div className="ml-auto pr-2">
              {isFinished ? (
                <span className="text-[10px] font-black uppercase text-primary animate-pulse">
                  {t('sim.playback.finished')}
                </span>
              ) : (
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    {t('sim.playback.progress', { visible: visibleCount, total: totalCandles })}
                  </div>
                  {!playing && (
                    <div className="text-[9px] font-bold uppercase text-amber-500/80 tracking-wider">
                      {t('sim.playback.pausedLabel')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 transition-colors bg-card',
        isPausedAtStart && 'border-primary/40 bg-primary/5'
      )}
    >
      {/* Timeline Slider */}
      <div className="flex flex-col gap-1 px-1">
        <input
          type="range"
          min="1"
          max={totalCandles}
          value={visibleCount}
          onChange={(e) => onJumpTo?.(parseInt(e.target.value))}
          disabled={isLoading}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary focus:outline-none"
        />
        <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
          <span>{formatDate(firstCandle?.time)}</span>
          <span className="text-primary">{formatDate(currentCandle?.time)}</span>
          <span>{formatDate(lastCandle?.time)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 px-1">
        {/* Play / Pause */}
        <button
          onClick={playing ? onPause : onPlay}
          disabled={disabled}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md border transition',
            isPaused && !disabled
              ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
              : 'hover:bg-accent disabled:opacity-40'
          )}
          title={
            playing ? t('sim.playback.pauseTitle') : t('sim.playback.playTitle')
          }
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5">
          {/* Step Backward */}
          <button
            onClick={onStepBackward}
            disabled={isLoading || visibleCount <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border transition hover:bg-accent disabled:opacity-40"
            title={t('sim.playback.stepBackwardTitle')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={disabled}
            className="flex h-8 w-8 items-center justify-center rounded-md border transition hover:bg-accent disabled:opacity-40"
            title={t('sim.playback.stepForwardTitle')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Skip to end */}
          <button
            onClick={onSkipToEnd}
            disabled={disabled}
            className="flex h-8 w-8 items-center justify-center rounded-md border transition hover:bg-accent disabled:opacity-40"
            title={t('sim.playback.skipToEndTitle')}
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
            {t('sim.playback.speedLabel')}
          </span>
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              onClick={() => onSetSpeed(s.value)}
              className={cn(
                'rounded px-2 py-1 text-[10px] font-bold transition',
                speed === s.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="ml-auto flex flex-col items-end">
          <div className="font-mono text-xs font-bold text-foreground">
            {visibleCount} / {totalCandles}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
            {isFinished ? t('sim.playback.finished') : t('sim.playback.candlesLabel')}
          </div>
        </div>
      </div>
    </div>
  );
}
