import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (updated: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user: User) =>
        set({
          user,
          token: user.token || null,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
      updateProfile: (updated: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updated } : null,
        })),
    }),
    {
      name: 'eventix_auth',
    }
  )
);
