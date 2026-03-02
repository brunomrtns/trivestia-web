import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/**
 * Renderiza os filhos diretamente em `document.body`, fora de qualquer
 * contexto de transformação (Framer Motion, etc.), garantindo que
 * `position: fixed` funcione em relação ao viewport inteiro.
 */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
