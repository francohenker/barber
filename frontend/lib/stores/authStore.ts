import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../api';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'BARBER' | 'USER';
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  handleOAuthToken: (token: string) => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true, // initial state
      hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },

      initialize: async () => {
        // Migrate old token if exists
        if (typeof window !== 'undefined') {
          const oldToken = localStorage.getItem('access_token');
          if (oldToken) {
            set({ token: oldToken });
            localStorage.removeItem('access_token');
          }
        }

        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }
        
        try {
          const user = await api.me(token);
          set({ user, isLoading: false });
        } catch {
          // Token is invalid or expired
          set({ user: null, token: null, isLoading: false });
        }
      },

      handleOAuthToken: async (token: string) => {
        set({ isLoading: true });
        try {
          const user = await api.me(token);
          set({ user, token, isLoading: false });
        } catch (e) {
          set({ user: null, token: null, isLoading: false });
          throw e;
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { accessToken } = await api.login(email, password);
          set({token: accessToken});
          const user = await api.me(accessToken);
          set({ user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        const { token } = get();
        if (token) {
          await api.logout(token).catch(() => {});
        }
        set({ user: null, token: null, isLoading: false });
      },
    }),
    {
      name: 'auth-storage', // key in localStorage
      partialize: (state) => ({ token: state.token }), // only save the token to localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
