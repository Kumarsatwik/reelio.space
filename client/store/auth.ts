import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  userId: string;
  email: string;
  name: string;
  subscriptions: string[];
  watchLater: string[];
  channelName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null, token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => set({ user, token, isAuthenticated: !!user }),
    }),
    {
      name: "auth-storage",
    }
  )
);
