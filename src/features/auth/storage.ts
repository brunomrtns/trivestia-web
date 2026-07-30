// Fonte centralizada para gerenciamento de sessão no localStorage.
//
// BI Identity SSO: a autenticação é feita via cookies de domínio (bi_auth /
// bi_refresh) definidos pelo Identity Service em /id/. O frontend não armazena
// mais tokens — apenas o usuário em cache e o slug do tenant.

const KEYS = {
  user: '@tm:user',
  lastTenantSlug: '@tm:lastTenantSlug',
  /** Slug do tenant onde o user está autenticado. Definido só no login. */
  authSlug: '@tm:authSlug'
} as const;

export const authStorage = {
  setUser: (user: string): void => {
    localStorage.setItem(KEYS.user, user);
  },

  getUser: (): string | null => localStorage.getItem(KEYS.user),

  clearUser: (): void => {
    localStorage.removeItem(KEYS.user);
  },

  getLastTenantSlug: (): string | null =>
    localStorage.getItem(KEYS.lastTenantSlug),

  setLastTenantSlug: (slug: string): void =>
    localStorage.setItem(KEYS.lastTenantSlug, slug),

  /** Slug do tenant autenticado — fonte de verdade para os guards. */
  getAuthSlug: (): string | null => localStorage.getItem(KEYS.authSlug),

  setAuthSlug: (slug: string): void =>
    localStorage.setItem(KEYS.authSlug, slug),

  clearSession: (): void => {
    // Chamadas separadas — localStorage.removeItem só aceita 1 chave por vez
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.authSlug); // limpa o tenant autenticado
    // lastTenantSlug FICA -- para redirecionar ao último tenant visitado
  }
};
