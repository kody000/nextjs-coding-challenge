import { redirect } from 'next/navigation';

interface GamePageProps {
  searchParams: Promise<{ roomId?: string }>;
}

export default async function GamePage({ searchParams }: GamePageProps) {
  const params = await searchParams;
  const roomId = params.roomId || `room-${Date.now()}`;
  redirect(`/game/${roomId}`);
}
