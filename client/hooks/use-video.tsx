import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export interface Video {
  videoId: string;
  title: string;
  description: string;
  status: string;
  url: string;
  thumbnail?: string;
  channelName?: string;
  createdAt: string;
}

export const useVideo = (videoId: string) => {
  const {
    data: video,
    isLoading,
    error,
  } = useQuery<Video>({
    queryKey: ["video", videoId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/videos/${videoId}`);
        return data;
      } catch (err) {
        // Log the error for debugging purposes
        console.error('Error fetching video:', err);
        // Re-throw the error so React Query can handle it properly
        throw err;
      }
    },
    // Add retry configuration for better error handling
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    video,
    isLoading,
    error,
  };
};

export const useUserVideos = (userId: string | undefined) => {
  const {
    data: videos,
    isLoading,
    error,
  } = useQuery<Video[]>({
    queryKey: ["userVideos", userId],
    queryFn: async () => {
      try {
        if (!userId) return [];
        const { data } = await api.get(`/videos/user/${userId}`);
        return data;
      } catch (err) {
        // Log the error for debugging purposes
        console.error('Error fetching user videos:', err);
        // Re-throw the error so React Query can handle it properly
        throw err;
      }
    },
    enabled: !!userId,
    // Add retry configuration for better error handling
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    videos,
    isLoading,
    error,
  };
};

