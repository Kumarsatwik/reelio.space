import VideoCard from './components/VideoCard'

async function getVideos() {
  // In a real application, you would fetch this data from your API
  return [
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
    {
      id: '2',
      title: 'Cooking Masterclass: Perfect Pasta',
      url: '/api/videos/2',
      resolutions: ['360p', '720p', '1080p'],
      views: 500000,
      likes: 25000,
      dislikes: 500,
      uploadDate: '1 week ago',
      channelName: 'Gourmet Delights',
      subscribers: 250000,
      thumbnail: '/placeholder.svg?height=180&width=320',
    },
    {
      id: '3',
      title: 'Tech Review: Latest Smartphones',
      url: '/api/videos/3',
      resolutions: ['360p', '720p', '1080p'],
      views: 750000,
      likes: 35000,
      dislikes: 2000,
      uploadDate: '3 days ago',
      channelName: 'Tech Insider',
      subscribers: 1000000,
      thumbnail: '/placeholder.svg?height=180&width=320',
    },
    {
      id: '4',
      title: 'Beginner\'s Guide to Oil Painting',
      url: '/api/videos/4',
      resolutions: ['360p', '720p', '1080p'],
      views: 300000,
      likes: 20000,
      dislikes: 300,
      uploadDate: '5 days ago',
      channelName: 'Art Studio',
      subscribers: 150000,
      thumbnail: '/placeholder.svg?height=180&width=320',
    },
    {
      id: '5',
      title: 'Exploring Ancient Ruins: Lost City Discovery',
      url: '/api/videos/5',
      resolutions: ['360p', '720p', '1080p'],
      views: 900000,
      likes: 45000,
      dislikes: 1500,
      uploadDate: '1 week ago',
      channelName: 'History Unearthed',
      subscribers: 750000,
      thumbnail: '/placeholder.svg?height=180&width=320',
    },
    {
      id: '6',
      title: 'Extreme Sports Compilation 2023',
      url: '/api/videos/6',
      resolutions: ['360p', '720p', '1080p'],
      views: 1200000,
      likes: 80000,
      dislikes: 2000,
      uploadDate: '3 weeks ago',
      channelName: 'Adrenaline Junkies',
      subscribers: 2000000,
      thumbnail: '/placeholder.svg?height=180&width=320',
    },
  ]
}

export default async function Home() {
  const videos = await getVideos()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Recommended Videos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
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
  )
}

