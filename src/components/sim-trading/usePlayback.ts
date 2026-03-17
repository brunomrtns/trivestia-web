import { useCallback, useEffect, useRef, useState } from 'react';

export type PlaybackSpeed = 40 | 100 | 200 | 250 | 500 | 1000 | 2000;

interface UsePlaybackOptions {
  onAdvance: () => void;
  onRewind?: () => void;
  isFinished: boolean;
}

export function usePlayback({
  onAdvance,
  onRewind,
  isFinished
}: UsePlaybackOptions) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isFinished) {
      setPlaying(false);
      clearTimer();
    }
  }, [isFinished, clearTimer]);

  useEffect(() => {
    if (playing && !isFinished) {
      clearTimer();
      intervalRef.current = setInterval(() => {
        onAdvance();
      }, speed);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [playing, speed, onAdvance, isFinished, clearTimer]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);

  const setSpeed = useCallback(
    (s: PlaybackSpeed) => {
      setSpeedState(s);
      if (playing) {
        clearTimer();
        intervalRef.current = setInterval(onAdvance, s);
      }
    },
    [playing, onAdvance, clearTimer]
  );

  const stepForward = useCallback(() => {
    if (!isFinished) onAdvance();
  }, [onAdvance, isFinished]);

  const stepBackward = useCallback(() => {
    if (onRewind) onRewind();
  }, [onRewind]);

  return { playing, speed, play, pause, setSpeed, stepForward, stepBackward };
}
