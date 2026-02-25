import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRouter } from './routes';
import { useAuthStore } from './features/auth/auth.store';
import { usePlatformAuthStore } from './features/platform/platform.store';
import '@/styles/globals.css';

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
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  </StrictMode>
);
