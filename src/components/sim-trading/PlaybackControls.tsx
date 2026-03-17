import {
  Play,
  Pause,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  Loader2,
  SkipBack
} from 'lucide-react';
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
  onSetSpeed
}: PlaybackControlsProps) {
  const { t } = useTranslation();
  const disabled = isFinished || isLoading;
  const isPausedAtStart =
    !playing && !isFinished && !isLoading && visibleCount === 1;
  const isPaused = !playing && !isFinished && !isLoading;

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
            title={t('sim.playback.stepBackwardTitle') || 'Step Backward'}
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
            {isFinished ? t('sim.playback.finished') : 'Candles'}
          </div>
        </div>
      </div>
    </div>
  );
}
