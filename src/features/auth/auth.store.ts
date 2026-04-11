import { create } from 'zustand';
import { authStorage } from './storage';
import type { User } from '@/types/api';

const LEARNING_V2_KEY = 'trivestia_learning_v2';

function readInitialLearningV2Flag(): boolean {
  if (typeof window === 'undefined') return false;

  const searchParams = new URLSearchParams(window.location.search);
  const forcedFlag = searchParams.get('learning_v2');
  if (forcedFlag === 'true') {
    localStorage.setItem(LEARNING_V2_KEY, 'true');
    return true;
  }

  if (forcedFlag === 'false') {
    localStorage.setItem(LEARNING_V2_KEY, 'false');
    return false;
  }

  const persisted = localStorage.getItem(LEARNING_V2_KEY);
  if (persisted === 'true') return true;
  if (persisted === 'false') return false;

  return false;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  useLearningV2: boolean;
  /** Slug do tenant corrente (populado via setAuth ou loadSession) */
  tenantSlug: string | null;
  setAuth: (
    user: User,
    token: string,
    refreshToken: string,
    tenantSlug?: string
  ) => void;
  setLearningV2: (enabled: boolean) => void;
  logout: () => void;
  loadSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  useLearningV2: readInitialLearningV2Flag(),
  tenantSlug: null,

  setAuth: (user, token, refreshToken, tenantSlug) => {
    authStorage.setSession(token, refreshToken, JSON.stringify(user));
    if (tenantSlug) {
      authStorage.setLastTenantSlug(tenantSlug);
      authStorage.setAuthSlug(tenantSlug); // slug de autenticação — imune a navegação
    }
    set({
      user,
      token,
      isAuthenticated: true,
      tenantSlug:
        tenantSlug ??
        authStorage.getAuthSlug() ??
        authStorage.getLastTenantSlug()
    });
  },

  setLearningV2: (enabled) => {
    localStorage.setItem(LEARNING_V2_KEY, enabled ? 'true' : 'false');
    set({ useLearningV2: enabled });
  },

  logout: () => {
    // clearSession é a ÚNICA fonte de verdade — também invocada pelo interceptor Axios
    authStorage.clearSession();
    set({ user: null, token: null, isAuthenticated: false, tenantSlug: null });
  },

  loadSession: () => {
    const token = authStorage.getToken();
    const userStr = authStorage.getUser();
    // authSlug é definido apenas no login e nunca sobrescrito por navegação
    const slug = authStorage.getAuthSlug() ?? authStorage.getLastTenantSlug();
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
