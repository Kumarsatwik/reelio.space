"use client";

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import VideoCard from './VideoCard';

interface Video {
  videoId: string;
  title: string;
  description: string;
  status: string;
  url: string;
  createdAt: string;
  thumbnail?: string;
  channelName?: string;
}

export default function VideoList() {
  const {
    data: videos,
    isLoading,
    error,
  } = useQuery<Video[]>({
    queryKey: ["userVideos"],
    queryFn: async () => {
      const { data } = await api.get(`/videos`);
      console.log("data", data);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading videos. Please try again later.
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        No videos found. Please upload some videos.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video.videoId}
          id={video.videoId}
          title={video.title}
          thumbnail={video.thumbnail || "/placeholder.svg"}
          channelName={video.channelName || "Unknown"}
          views={0}
          uploadDate={video.createdAt}
        />
      ))}
    </div>
  );
}
