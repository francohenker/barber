import { create } from 'zustand';
import { api } from '../api';

interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'BARBER';
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  handleOAuthToken: (token: string) => Promise<void>;
}

const STORAGE_KEY = 'access_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isLoading: true,

  initialize: async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await api.me(storedToken);
      set({ user, token: storedToken });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      set({ isLoading: false });
    }
  },

  handleOAuthToken: async (token: string) => {
    localStorage.setItem(STORAGE_KEY, token);
    const user = await api.me(token);
    set({ user, token, isLoading: false });
  },

  login: async (email: string, password: string) => {
    const { accessToken } = await api.login(email, password);
    localStorage.setItem(STORAGE_KEY, accessToken);
    const user = await api.me(accessToken);
    set({ user, token: accessToken });
  },

  logout: async () => {
    const state = useAuthStore.getState();
    if (state.token) await api.logout(state.token).catch(() => {});
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, token: null });
  },
}));
