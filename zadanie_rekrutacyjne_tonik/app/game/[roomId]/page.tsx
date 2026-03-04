'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGame } from '@/hooks/useGame';
import { TypingArea } from '@/components/game/TypingArea';
import { Leaderboard } from '@/components/game/Leaderboard';
import { JoinGame } from '@/components/game/JoinGame';
import { LoadingState, ErrorState } from '@/components/game/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function getInitialName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('playerName') || '';
  } catch {
    return '';
  }
}

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [playerName, setPlayerName] = useState<string>(getInitialName);
  const [hasJoined, setHasJoined] = useState(false);

  const {
    roomState,
    timeLeft,
    isLoading,
    error,
    tableState,
    sortedPlayers,
    joinRoom,
    updateProgress,
    setTableState,
  } = useGame(roomId, playerName);

  const handleJoin = async (name: string) => {
    setPlayerName(name);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('playerName', name);
      } catch {
        // Ignore storage errors
      }
    }
    setHasJoined(true);
    await joinRoom(name);
  };

  const currentPlayerKey = roomState ? Object.keys(roomState.players).find(
    key => roomState.players[key]?.name === playerName
  ) : null;

  const isPendingPlayer = roomState && !currentPlayerKey && Object.values(roomState.pendingPlayers || {}).some(p => p.name === playerName);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <JoinGame onJoin={handleJoin} isJoining={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            Room: <span className="text-blue-600">{roomId}</span>
          </h1>
          <div className="text-sm text-gray-500">
            Round {roomState?.roundNumber || 1}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Sentence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-gray-700">
                  {roomState?.currentSentence || 'Waiting for round...'}
                </p>
              </CardContent>
            </Card>

            <TypingArea
              targetText={roomState?.currentSentence || ''}
              currentText={currentPlayerKey && roomState?.players[currentPlayerKey] ? roomState.players[currentPlayerKey].currentText : ''}
              onChange={(text) => {
                if (currentPlayerKey && roomState) {
                  const isFinished = text === roomState.currentSentence;
                  updateProgress(text, isFinished);
                }
              }}
              disabled={!roomState?.isRoundActive || isPendingPlayer || false}
              timeLeft={timeLeft}
              isFinished={currentPlayerKey ? roomState?.players[currentPlayerKey]?.finished ?? false : false}
            />
          </div>

          <div>
            <Leaderboard
              players={sortedPlayers}
              tableState={tableState}
              onTableStateChange={setTableState}
              currentPlayerId={currentPlayerKey || ''}
              targetLength={roomState?.currentSentence.length || 1}
              isPending={isPendingPlayer || false}
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Back to lobby / Create new room
          </Link>
        </div>
      </div>
    </div>
  );
}
