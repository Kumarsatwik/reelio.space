"use client";
import VideoPlayer from "../../(components)/VideoPlayer";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useParams } from "next/navigation";

interface Video {
  videoId: string;
  title: string;
  description: string;
  status: string;
  inputPath: string;
  outputPath: string;
  createdAt: string;
}

export default function WatchPage() {
  const params = useParams();

  const {
    data: video,
    isLoading,
    error,
  } = useQuery<Video>({
    queryKey: ["video", params.id],
    queryFn: async () => {
      const { data } = await api.get(`/videos/${params.id}`);
      console.log("data", data);
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
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
