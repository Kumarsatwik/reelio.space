"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThumbsUp, ThumbsDown, Share2, Save } from "lucide-react";

import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface VideoPlayerProps {
  videoId: string;
  title: string;
  description: string;
  status: string;
  url: string;
  createdAt: string;
}

export default function VideoPlayer({
  videoId,
  title,
  description,
  status,
  url,
  createdAt,
}: VideoPlayerProps) {
  const resolutions = ["Auto","360p", "480p", "720p"];

  const [currentResolution, setCurrentResolution] = useState(resolutions[0]);
  const [currentUrl, setCurrentUrl] = useState(url); // Store the current video URL
  const [currentTime, setCurrentTime] = useState(0);

  // Automatically change resolution based on network speed
  const handleResolutionChange = (value: string) => {
    setCurrentResolution(value);
    
    if (value === 'Auto') {
      // Reset to master playlist for automatic adaptation
      setCurrentUrl(url);
    } else {
      // Manual resolution selection
      const baseUrl = url.replace(/\/\d+p\/index\.m3u8$/, '/master.m3u8');
      const newUrl = baseUrl.replace('master.m3u8', `${value}/index.m3u8`);
      setCurrentUrl(newUrl);
    }
  };

  // console.log('currentUrl',currentUrl)

  // Function to detect network speed and adjust resolution
  const detectNetworkSpeed = () => {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection as NetworkInformation;
      console.log("connection", connection.effectiveType);
      // Network type (e.g., 'wifi', 'cellular')
      const effectiveType = connection.effectiveType;

      // Adjust resolution based on network speed
      if (effectiveType === "slow-2g" || effectiveType === "2g") {
        setCurrentResolution(resolutions[0]); // Use the lowest resolution
      } else if (effectiveType === "3g") {
        setCurrentResolution(resolutions[1]); // Use medium resolution
      } else {
        setCurrentResolution(resolutions[resolutions.length - 1]); // Use the highest resolution
      }
    }
  };

  // Monitor network speed changes
  useEffect(() => {
    detectNetworkSpeed();
    // Add event listener to detect changes in network speed
    if (typeof navigator !== 'undefined' && navigator.connection) {
      navigator.connection.addEventListener("change", detectNetworkSpeed);
    }

    return () => {
      if (typeof navigator !== 'undefined' && navigator.connection) {
        navigator.connection.removeEventListener("change", detectNetworkSpeed);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="aspect-video">
        <ReactPlayer
          url={currentUrl}
          controls
          width="100%"
          height="100%"
          className="rounded-lg overflow-hidden"
          playing
          onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
          onReady={(player) => {
            player.seekTo(currentTime, 'seconds');
            player.getInternalPlayer()?.play();
          }}
          config={{
            file: {
              hlsOptions: {
                startLevel: -1, // Start at a level that is most appropriate based on network conditions
                maxBufferLength: 10, // Buffer at most 30 seconds
                maxMaxBufferLength: 60, // Max buffer for larger file sizes
                maxBufferSize: 1000000, // Max buffer size in bytes
              },
            },
          }}
        />
      </div>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
             {new Date(createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-4">
            {/* <Button variant="ghost" size="sm">
              <ThumbsUp className="mr-2 h-4 w-4" />
              {like.size.toLocaleString("en-US")}
            </Button>
            <Button variant="ghost" size="sm">
              <ThumbsDown className="mr-2 h-4 w-4" />
              {dislike.size.toLocaleString("en-US")}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button> */}

            <Select
              onValueChange={handleResolutionChange}
              defaultValue={currentResolution}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                {resolutions.map((resolution) => (
                  <SelectItem key={resolution} value={resolution}>
                    {resolution}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4 border-t border-b py-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div>
          <h2 className="font-bold"></h2>
          <p className="text-sm text-gray-500">
            {/* {subscribers.toLocaleString("en-US")} subscribers */}
          </p>
        </div>
        <Button className="ml-auto">Subscribe</Button>
      </div>
    </div>
  );
}
