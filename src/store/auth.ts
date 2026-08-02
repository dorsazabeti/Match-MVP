import { create } from "zustand";


type User = {
  id: string;
  email: string;
  role: string | null;
  status: string;
};


type AuthState = {
  token: string | null;
  user: User | null;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
};


export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setToken: (token) =>
    set({
      token,
    }),

  setUser: (user) =>
    set({
      user,
    }),

  logout: () =>
    set({
      token: null,
      user: null,
    }),
}));
