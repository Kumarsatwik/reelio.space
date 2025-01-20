'use client'

import { useState } from 'react'
import ReactPlayer from 'react-player'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThumbsUp, ThumbsDown, Share2, Save } from 'lucide-react'

interface VideoPlayerProps {
  id: string
  title: string
  url: string
  resolutions: string[]
  views: number
  likes: number
  dislikes: number
  uploadDate: string
  channelName: string
  subscribers: number
}

export default function VideoPlayer({
  id,
  title,
  url,
  resolutions,
  views,
  likes,
  dislikes,
  uploadDate,
  channelName,
  subscribers
}: VideoPlayerProps) {
  const [currentResolution, setCurrentResolution] = useState(resolutions[resolutions.length - 1])

  const handleResolutionChange = (value: string) => {
    setCurrentResolution(value)
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video">
        <ReactPlayer
          url={`${url}/${currentResolution}`}
          controls
          width="100%"
          height="100%"
          className="rounded-lg overflow-hidden"
        />
      </div>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {views.toLocaleString()} views • {uploadDate}
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <ThumbsUp className="mr-2 h-4 w-4" />
              {likes.toLocaleString()}
            </Button>
            <Button variant="ghost" size="sm">
              <ThumbsDown className="mr-2 h-4 w-4" />
              {dislikes.toLocaleString()}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Select onValueChange={handleResolutionChange} defaultValue={currentResolution}>
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
          <h2 className="font-bold">{channelName}</h2>
          <p className="text-sm text-gray-500">{subscribers.toLocaleString()} subscribers</p>
        </div>
        <Button className="ml-auto">Subscribe</Button>
      </div>
    </div>
  )
}

