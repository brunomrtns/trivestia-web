import { create } from 'zustand';
import { authStorage } from './storage';
import type { User } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  loadSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token, refreshToken) => {
    authStorage.setSession(token, refreshToken, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    // clearSession é a ÚNICA fonte de verdade — também invocada pelo interceptor Axios
    authStorage.clearSession();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadSession: () => {
    const token = authStorage.getToken();
    const userStr = authStorage.getUser();
    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        authStorage.clearSession();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  }
}));
