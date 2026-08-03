import { create } from "zustand";

import { getCurrentUser } from "../services/auth";
import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
} from "../services/session";


export type User = {
  id: string;
  display_name: string | null;
  email: string;
  role: string | null;
  status: string;
};


type AuthState = {
  token: string | null;
  user: User | null;
  isHydrated: boolean;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setSession: (token: string, user: User) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};


export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  setToken: (token) =>
    set({
      token,
    }),

  setUser: (user) =>
    set({
      user,
    }),

  setSession: async (token, user) => {
    await saveSessionToken(token);

    set({
      token,
      user,
    });
  },

  hydrate: async () => {
    try {
      const token = await loadSessionToken();

      if (!token) {
        set({ isHydrated: true });
        return;
      }

      const user = await getCurrentUser(token);

      set({
        token,
        user,
        isHydrated: true,
      });
    } catch {
      await clearSessionToken();

      set({
        token: null,
        user: null,
        isHydrated: true,
      });
    }
  },

  logout: async () => {
    await clearSessionToken();

    set({
      token: null,
      user: null,
    });
  },
}));
