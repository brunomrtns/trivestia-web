// Fonte centralizada para gerenciamento de sessão no localStorage.
// BUGFIX: localStorage.removeItem só remove UMA chave por vez — nunca passar varargs.

const KEYS = {
  token: '@tm:token',
  refreshToken: '@tm:refreshToken',
  user: '@tm:user'
} as const;

export const authStorage = {
  setSession: (token: string, refreshToken: string, user: string): void => {
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.refreshToken, refreshToken);
    localStorage.setItem(KEYS.user, user);
  },

  getToken: (): string | null => localStorage.getItem(KEYS.token),

  getRefreshToken: (): string | null => localStorage.getItem(KEYS.refreshToken),

  getUser: (): string | null => localStorage.getItem(KEYS.user),

  clearSession: (): void => {
    // Chamadas separadas — localStorage.removeItem só aceita 1 chave por vez
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.refreshToken);
    localStorage.removeItem(KEYS.user);
  }
};
