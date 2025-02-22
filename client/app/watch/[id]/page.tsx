"use client";

import Loader from "@/components/Loader";
import VideoPlayer from "@/components/VideoPlayer";
import { useVideo } from "@/hooks/use-video";
import { useParams } from "next/navigation";

export default function WatchPage() {
  const params = useParams();
  const { video, isLoading, error } = useVideo(params.id as string);

  if (isLoading) {
    <Loader />;
  }

  if (error || !video) {
    return <div>Error loading video</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VideoPlayer {...video} />
        </div>
      </div>
    </div>
  );
}
