import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth";
import { removeCookies } from "@/utils/cookies";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and cookies
      useAuthStore.getState().setUser(null, null);
      removeCookies();

      // Call logout endpoint to clear server-side session
      try {
        await api.post("/auth/logout");
      } catch (logoutError) {
        console.error("Logout failed:", logoutError);
      }

      // Redirect to login page
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
