import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const roomId = 'lobby';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Typing Competition</h1>
          <p className="text-gray-500">Test your typing speed in real-time!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Join a Game</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/game/${roomId}`}>
              <Button className="w-full" size="lg">
                Join Public Lobby
              </Button>
            </Link>
            
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or create private room</span>
              </div>
            </div>

            <form action="/game" method="GET" className="flex gap-2">
              <input
                type="text"
                name="roomId"
                placeholder="Enter room name..."
                className="flex-1 border rounded-lg px-4 py-2"
                required
                pattern="[a-zA-Z0-9-]+"
                title="Letters, numbers, and dashes only"
              />
              <Button type="submit" variant="secondary">
                Create
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Type sentences as fast as you can!</p>
          <p>Compete with others in real-time.</p>
        </div>
      </div>
    </div>
  );
}
