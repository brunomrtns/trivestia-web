import { useRef, useCallback } from 'react';

/**
 * Retorna uma versão debounced de um callback.
 * O timer é resetado a cada chamada; o callback só executa após `delay` ms de silêncio.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}
