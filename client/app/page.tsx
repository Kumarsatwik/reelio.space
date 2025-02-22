import VideoList from './(components)/VideoList';
export default async function Home() {

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Discover Videos</h1>
      <VideoList />
    </div>
  )
}
