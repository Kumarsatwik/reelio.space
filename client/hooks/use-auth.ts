import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import api from "@/services/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials extends LoginCredentials {
  name: string;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
  channelName?: string;
}

export const useAuth = () => {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        const { data } = await api.post("/auth/login", credentials);
        return data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Login failed");
      }
    },
    onSuccess: (data) => {
      if (data.user && data.token) {
        setUser(data.user, data.token);
        router.push("/");
        router.refresh();
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error.response?.data || error);
      throw error;
    },
  });
  const signup = useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      try {
        const { data } = await api.post("/auth/register", credentials);
        return data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Registration failed");
      }
    },
    onSuccess: (data) => {
      if (data.user && data.token) {
        setUser(data.user, data.token);
        router.push("/");
        router.refresh();
      }
    },
  });
  const logout = useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout");
      } finally {
        setUser(null, null);
      }
    },
    onSettled: () => {
      router.push("/login");
      router.refresh();
    },
  });
  const updateProfile = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      try {
        const response = await api.put("/auth/profile", data);
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Profile update failed");
      }
    },
    onSuccess: (data) => {
      if (data.user) {
        const currentToken = useAuthStore.getState().token;
        setUser(data.user, currentToken);
      }
    },
  });
  return {
    login: {
      ...login,
      isLoading: login.isPending,
      error: login.error?.message,
    },
    signup: {
      ...signup,
      isLoading: signup.isPending,
      error: signup.error?.message,
    },
    logout: {
      ...logout,
      isLoading: logout.isPending,
      error: logout.error?.message,
    },
    updateProfile: {
      ...updateProfile,
      isLoading: updateProfile.isPending,
      error: updateProfile.error?.message,
    },
  };
};
