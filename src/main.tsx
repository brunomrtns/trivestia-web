import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'sonner';
import { AppRouter } from './routes';
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary';
import { useAuthStore } from './features/auth/auth.store';
import { usePlatformAuthStore } from './features/platform/platform.store';
import '@/styles/globals.css';
import i18n from '@/i18n/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1
    }
  }
});

// Hidrata os stores a partir do localStorage antes do primeiro render
useAuthStore.getState().loadSession();
usePlatformAuthStore.getState().loadSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ChunkErrorBoundary>
          <AppRouter />
        </ChunkErrorBoundary>
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>
);
