import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth";
import { removeCookies } from "@/utils/cookies";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for CORS credentials
api.interceptors.request.use((config) => {
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Call logout mutation to properly clear auth state'
      const { logout } = useAuth();
      try {
        logout.mutate();
      } finally {
        useAuthStore.getState().setUser(null);
        removeCookies();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
