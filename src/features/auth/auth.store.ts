import { create } from 'zustand';
import { authStorage } from './storage';
import type { User } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Slug do tenant corrente (populado via setAuth ou loadSession) */
  tenantSlug: string | null;
  setAuth: (
    user: User,
    token: string,
    refreshToken: string,
    tenantSlug?: string
  ) => void;
  logout: () => void;
  loadSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  tenantSlug: null,

  setAuth: (user, token, refreshToken, tenantSlug) => {
    authStorage.setSession(token, refreshToken, JSON.stringify(user));
    if (tenantSlug) authStorage.setLastTenantSlug(tenantSlug);
    set({
      user,
      token,
      isAuthenticated: true,
      tenantSlug: tenantSlug ?? authStorage.getLastTenantSlug()
    });
  },

  logout: () => {
    // clearSession é a ÚNICA fonte de verdade — também invocada pelo interceptor Axios
    authStorage.clearSession();
    set({ user: null, token: null, isAuthenticated: false, tenantSlug: null });
  },

  loadSession: () => {
    const token = authStorage.getToken();
    const userStr = authStorage.getUser();
    const slug = authStorage.getLastTenantSlug();
    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          tenantSlug: slug
        });
      } catch {
        authStorage.clearSession();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  }
}));
