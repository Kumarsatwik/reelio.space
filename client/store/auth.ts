import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  userId:string;
  email: string;
  name: string;
  subscriptions: string[];
  watchLater: string[];
  channelName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: "auth-storage",
    }
  )
);
