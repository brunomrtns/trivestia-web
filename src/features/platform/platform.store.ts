import { create } from 'zustand';
import { platformStorage } from './platformStorage';
import type { PlatformUser } from '@/types/api';

interface PlatformAuthState {
  user: PlatformUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: PlatformUser, token: string, refreshToken: string) => void;
  logout: () => void;
  loadSession: () => void;
}

export const usePlatformAuthStore = create<PlatformAuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token, refreshToken) => {
    platformStorage.setSession(token, refreshToken, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    platformStorage.clearSession();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadSession: () => {
    const token = platformStorage.getToken();
    const userStr = platformStorage.getUser();
    if (token && userStr) {
      try {
        const user: PlatformUser = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        platformStorage.clearSession();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  }
}));
