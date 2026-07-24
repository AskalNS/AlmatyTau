import { create } from 'zustand';
import type { SessionUser, LoginResponse, TotpRequiredResponse } from '@atm/contracts';
import { API } from '@atm/contracts';
import { api, setTokens, setLogoutHandler } from '@/lib/api';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  /** true, пока не проверили сохранённую сессию при старте. */
  initializing: boolean;
  login: (email: string, password: string, totp?: string) => Promise<'ok' | 'totp'>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initializing: true,

  async init() {
    // При старте пробуем восстановить сессию по сохранённым токенам.
    setLogoutHandler(() => {
      setTokens(null, null);
      set({ user: null });
    });
    try {
      const user = await api.get<SessionUser>(API.auth.me);
      set({ user, initializing: false });
    } catch {
      set({ user: null, initializing: false });
    }
  },

  async login(email, password, totp) {
    set({ loading: true });
    try {
      const res = await api.post<LoginResponse | TotpRequiredResponse>(API.auth.login, {
        email,
        password,
        totp,
      });
      if ('totpRequired' in res) {
        set({ loading: false });
        return 'totp';
      }
      setTokens(res.accessToken, res.refreshToken);
      set({ user: res.user, loading: false });
      return 'ok';
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  async logout() {
    const refresh = localStorage.getItem('atm_refresh');
    try {
      if (refresh) await api.post(API.auth.logout, { refreshToken: refresh });
    } catch {
      /* всё равно выходим локально */
    }
    setTokens(null, null);
    set({ user: null });
  },

  async refreshUser() {
    const user = await api.get<SessionUser>(API.auth.me);
    set({ user });
  },
}));
