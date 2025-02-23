"use client";
import { VideoIcon } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { useUserVideos } from "@/hooks/use-video";
import VideoCard from "@/components/VideoCard";
import Loader from "@/components/Loader";

export default function VideosPage() {
  const { user } = useAuthStore();
  const { videos, isLoading, error } = useUserVideos(user?.userId);

  // Now handle the rendering logic after hooks
  if (!user) {
    return (
      <div className="p-8 text-center">
        <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Please login to view your videos
        </h3>
        <Link href="/login" className="mt-1 text-sm text-gray-500">
          Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    <Loader />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading videos. Please try again later.
      </div>
    );
  }

  if (!videos?.length) {
    return (
      <div className="p-8 text-center">
        <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No videos</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by uploading your first video.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link key={video.videoId} href={`/watch/${video.videoId}`}>
          <VideoCard
            key={video.videoId}
            id={video.videoId}
            title={video.title}
            thumbnail={video.thumbnail || "/placeholder.svg"}
            channelName={video.channelName || "Unknown"}
            views={0}
            uploadDate={video.createdAt}
          />
        </Link>
      ))}
    </div>
  );
}
