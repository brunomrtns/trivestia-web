import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/auth.store';
import { apiTenant } from '@/services/api/apiTenant';

interface ChatTokenResult {
  chatToken: string;
  expiresIn: number;
  serverUrl: string;
  tenantId: string;
}

interface UseChatTokenReturn {
  chatToken: string | null;
  serverUrl: string;
  tenantId: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const CHAT_SERVER_URL =
  import.meta.env.VITE_CHAT_SERVER_URL ?? 'http://localhost:3001';

/** Obtém (e renova automaticamente) o chatToken via trademaster-api */
export function useChatToken(): UseChatTokenReturn {
  const tenantSlug = useAuthStore((s) => s.tenantSlug);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [chatToken, setChatToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>(CHAT_SERVER_URL);
  const [tenantId, setTenantId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!tenantSlug || !isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const api = apiTenant(tenantSlug);
      const { data } = await api.post<ChatTokenResult>('/chat/token');
      setChatToken(data.chatToken);
      setServerUrl(data.serverUrl ?? CHAT_SERVER_URL);
      setTenantId(data.tenantId ?? '');
      // Agendar renovação 2 min antes de expirar
      const renewIn = Math.max((data.expiresIn - 120) * 1000, 60_000);
      setTimeout(() => { fetch(); }, renewIn);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao obter token do chat';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, isAuthenticated]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { chatToken, serverUrl, tenantId, isLoading, error, refresh: fetch };
}
