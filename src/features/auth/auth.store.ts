import { create } from 'zustand';
import { authStorage } from './storage';
import { authEndpoints } from '@/services/endpoints/auth.endpoints';
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

/** Redirect to BI Identity login page. */
export function redirectToBiLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/id/login?redirect=/trivestia/';
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  useLearningV2: boolean;
  /** Slug do tenant corrente (populado via setUser ou loadSession) */
  tenantSlug: string | null;
  setUser: (user: User, tenantSlug?: string) => void;
  setLearningV2: (enabled: boolean) => void;
  logout: () => void;
  loadSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  useLearningV2: readInitialLearningV2Flag(),
  tenantSlug: null,

  setUser: (user, tenantSlug) => {
    authStorage.setUser(JSON.stringify(user));
    if (tenantSlug) {
      authStorage.setLastTenantSlug(tenantSlug);
      authStorage.setAuthSlug(tenantSlug); // slug de autenticação — imune a navegação
    }
    set({
      user,
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
    set({ user: null, isAuthenticated: false, tenantSlug: null });
    // Redirect to BI Identity logout to clear SSO cookies (bi_auth / bi_refresh),
    // which then redirects back to /trivestia/ (login page).
    if (typeof window !== 'undefined') {
      window.location.href = '/id/logout?redirect=/trivestia/';
    }
  },

  loadSession: () => {
    // authSlug é definido apenas no login e nunca sobrescrito por navegação
    const slug = authStorage.getAuthSlug() ?? authStorage.getLastTenantSlug();
    const userStr = authStorage.getUser();

    if (userStr) {
      try {
        const user: User = JSON.parse(userStr);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          tenantSlug: slug
        });
        // Validate the session against the API (cookie-based).
        // On 401 the interceptor will redirect to /id/login.
        authEndpoints
          .getMe(slug ?? '')
          .then((fresh) => {
            authStorage.setUser(JSON.stringify(fresh));
            set({ user: fresh });
          })
          .catch(() => {
            /* interceptor handles redirect */
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
