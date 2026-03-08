import { Play, Pause, SkipForward, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PlaybackSpeed } from './usePlayback';

const SPEEDS: { value: PlaybackSpeed; label: string }[] = [
  { value: 2000, label: '0.5×' },
  { value: 1000, label: '1×' },
  { value: 500, label: '2×' },
  { value: 250, label: '4×' }
];

interface PlaybackControlsProps {
  playing: boolean;
  speed: PlaybackSpeed;
  visibleCount: number;
  totalCandles: number;
  isFinished: boolean;
  isLoading?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onSkipToEnd: () => void;
  onSetSpeed: (s: PlaybackSpeed) => void;
}

export function PlaybackControls({
  playing,
  speed,
  visibleCount,
  totalCandles,
  isFinished,
  isLoading,
  onPlay,
  onPause,
  onStepForward,
  onSkipToEnd,
  onSetSpeed
}: PlaybackControlsProps) {
  const { t } = useTranslation();
  const disabled = isFinished || isLoading;
  const isPausedAtStart =
    !playing && !isFinished && !isLoading && visibleCount === 1;
  const isPaused = !playing && !isFinished && !isLoading;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-2 text-xs transition-colors',
        isPausedAtStart
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card'
      )}
    >
      {/* Play / Pause */}
      <button
        onClick={playing ? onPause : onPlay}
        disabled={disabled}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md border transition',
          isPaused && !disabled
            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
            : 'hover:bg-accent disabled:opacity-40'
        )}
        title={playing ? t('sim.playback.pauseTitle') : t('sim.playback.playTitle')}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : playing ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Paused hint label — visible when not playing */}
      {isPaused && (
        <span
          className={cn(
            'text-xs font-medium',
            isPausedAtStart ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {isPausedAtStart ? t('sim.playback.pausedAtStartHint') : t('sim.playback.pausedLabel')}
        </span>
      )}

      {/* Step */}
      <button
        onClick={onStepForward}
        disabled={disabled}
        className="flex h-7 w-7 items-center justify-center rounded-md border transition hover:bg-accent disabled:opacity-40"
        title={t('sim.playback.stepForwardTitle')}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Skip to end */}
      <button
        onClick={onSkipToEnd}
        disabled={disabled}
        className="flex h-7 w-7 items-center justify-center rounded-md border transition hover:bg-accent disabled:opacity-40"
        title={t('sim.playback.skipToEndTitle')}
      >
        <SkipForward className="h-3.5 w-3.5" />
      </button>

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">{t('sim.playback.speedLabel')}</span>
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSetSpeed(s.value)}
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium transition',
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
      <div className="ml-auto font-mono text-muted-foreground">
        {isFinished ? t('sim.playback.finished') : t('sim.playback.progress', { visible: visibleCount, total: totalCandles })}
      </div>
    </div>
  );
}
