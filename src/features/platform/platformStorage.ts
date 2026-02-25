const KEYS = {
  token: '@tm:plt:token',
  refreshToken: '@tm:plt:refreshToken',
  user: '@tm:plt:user'
} as const;

export const platformStorage = {
  setSession: (token: string, refreshToken: string, user: string): void => {
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.refreshToken, refreshToken);
    localStorage.setItem(KEYS.user, user);
  },

  getToken: (): string | null => localStorage.getItem(KEYS.token),

  getRefreshToken: (): string | null => localStorage.getItem(KEYS.refreshToken),

  getUser: (): string | null => localStorage.getItem(KEYS.user),

  clearSession: (): void => {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.refreshToken);
    localStorage.removeItem(KEYS.user);
  }
};
