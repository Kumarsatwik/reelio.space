import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Home, Compass, Clock, ThumbsUp, PlaySquare, Film, Upload } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r overflow-y-auto">
      <nav className="p-4 space-y-2">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start">
          <Compass className="mr-2 h-4 w-4" />
          Explore
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Clock className="mr-2 h-4 w-4" />
          History
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <ThumbsUp className="mr-2 h-4 w-4" />
          Liked Videos
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <PlaySquare className="mr-2 h-4 w-4" />
          Your Videos
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Film className="mr-2 h-4 w-4" />
          Watch Later
        </Button>
        <Link href="/upload">
          <Button variant="ghost" className="w-full justify-start">
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </Link>
      </nav>
    </aside>
  )
}

