import VideoPlayer from '../../components/VideoPlayer'
import VideoCard from '../../components/VideoCard'

async function getVideo(id: string) {
  // In a real application, you would fetch this data from your API based on the id
  const videos = [
    {
      id: '1',
      title: 'Amazing Landscapes 4K',
      url: '/api/videos/1',
      resolutions: ['360p', '720p', '1080p', '4K'],
      views: 1000000,
      likes: 50000,
      dislikes: 1000,
      uploadDate: '2 weeks ago',
      channelName: 'Nature Explorers',
      subscribers: 500000,
      thumbnail: '/placeholder.svg?height=180&width=320',
    },
    // ... (include all other videos from the getVideos function)
  ]
  return videos.find(video => video.id === id) || null
}

async function getRecommendedVideos(currentId: string) {
  // In a real application, you would fetch recommended videos based on the current video
  const allVideos = [
    // ... (include all videos from the getVideos function)
  ]
  return allVideos.filter(video => video.id !== currentId)
}

export default async function WatchPage({ params }: { params: { id: string } }) {
  const video = await getVideo(params.id)
  const recommendedVideos = await getRecommendedVideos(params.id)

  if (!video) {
    return <div>Video not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VideoPlayer {...video} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Recommended Videos</h2>
          <div className="space-y-4">
            {recommendedVideos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video.thumbnail}
                channelName={video.channelName}
                views={video.views}
                uploadDate={video.uploadDate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

