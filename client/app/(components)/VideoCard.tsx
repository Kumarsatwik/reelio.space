import Link from 'next/link'
import Image from 'next/image'

interface VideoCardProps {
  id: string
  title: string
  thumbnail: string
  channelName: string
  views: number
  uploadDate: string
}

export default function VideoCard({ id, title, thumbnail, channelName, views, uploadDate }: VideoCardProps) {

  console.log("thumbnail", thumbnail);

  return (
    <Link href={`/watch/${id}`} className="group">
      <div className="aspect-video relative rounded-lg overflow-hidden">
        <Image
          src={thumbnail || "/placeholder.svg"}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{channelName}</p>
        <p className="text-xs text-gray-500">
          {views.toLocaleString()} views • {new Date(uploadDate).toLocaleDateString()}
        </p>
      </div>
    </Link>
  )
}

