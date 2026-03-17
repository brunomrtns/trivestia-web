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
