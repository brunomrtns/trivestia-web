import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Captura erros de "Failed to fetch dynamically imported module" que ocorrem
 * quando o browser tem o HTML em cache mas o novo deploy gerou chunks com
 * hashes diferentes.
 *
 * Ao detectar esse tipo de erro, recarrega a página automaticamente uma vez
 * para garantir que o usuário receba os novos assets.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      // Recarrega uma única vez para buscar os novos assets
      const lastReload = sessionStorage.getItem('__chunk_reload');
      if (!lastReload) {
        sessionStorage.setItem('__chunk_reload', '1');
        window.location.reload();
      }
    }

    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChunkErrorBoundary]', error, info);
  }

  render() {
    // Se já recarregou e ainda deu erro, mostra mensagem simples
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold">
            Ocorreu um problema ao carregar a aplicação.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
