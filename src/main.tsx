import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppRouter } from './routes';
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary';
import { useAuthStore } from './features/auth/auth.store';
import { usePlatformAuthStore } from './features/platform/platform.store';
import '@/styles/globals.css';
import i18n from '@/i18n/i18n';

const GOOGLE_CLIENT_ID = '364332376664-8df5jsbts97ejeut5gma2a74uoleirh2.apps.googleusercontent.com';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1
    }
  }
});

function forceRefreshForChunkError() {
  const key = '__chunk_reload_global';
  const alreadyReloaded = sessionStorage.getItem(key);
  if (alreadyReloaded) return;

  sessionStorage.setItem(key, '1');

  const url = new URL(window.location.href);
  url.searchParams.set('_v', Date.now().toString());
  window.location.replace(url.toString());
}

function isChunkLoadMessage(msg: string) {
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('ChunkLoadError')
  );
}

// Captura erros de import dinâmico fora do React error boundary (ex: Router lazy)
window.addEventListener('error', (event) => {
  const message =
    (event.error as Error | undefined)?.message ?? event.message ?? '';
  if (isChunkLoadMessage(String(message))) {
    forceRefreshForChunkError();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    (reason as Error | undefined)?.message ??
    (typeof reason === 'string' ? reason : '');
  if (isChunkLoadMessage(String(message))) {
    forceRefreshForChunkError();
  }
});

// Hidrata os stores a partir do localStorage antes do primeiro render
useAuthStore.getState().loadSession();
usePlatformAuthStore.getState().loadSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ChunkErrorBoundary>
            <AppRouter />
          </ChunkErrorBoundary>
          <Toaster richColors position="top-right" closeButton />
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>
);
