import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom, startNewRound, endRound, getRoom } from '@/lib/room-store';
import { pusherServer, getChannelName } from '@/lib/pusher';

const ROUND_DURATION = parseInt(process.env.NEXT_PUBLIC_ROUND_DURATION || '60');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId } = body;

    if (!action || !roomId) {
      return NextResponse.json({ error: 'Missing action or roomId' }, { status: 400 });
    }

    let room;
    switch (action) {
      case 'start-round':
        room = startNewRound(roomId);
        await pusherServer.trigger(getChannelName(roomId), 'round-start', {
          sentence: room.currentSentence,
          roundNumber: room.roundNumber,
          roundStartTime: room.roundStartTime,
        });
        break;
      case 'end-round':
        room = endRound(roomId);
        await pusherServer.trigger(getChannelName(roomId), 'round-end', {});
        break;
      case 'request-round':
        room = getRoom(roomId);
        if (!room || !room.isRoundActive) {
          room = startNewRound(roomId);
          await pusherServer.trigger(getChannelName(roomId), 'round-start', {
            sentence: room.currentSentence,
            roundNumber: room.roundNumber,
            roundStartTime: room.roundStartTime,
          });
        }
        break;
      case 'get-room':
        room = getRoom(roomId);
        if (!room) {
          room = getOrCreateRoom(roomId);
        }
        const timeRemaining = room.isRoundActive && room.roundStartTime
          ? Math.max(0, ROUND_DURATION - Math.floor((Date.now() - room.roundStartTime) / 1000))
          : 0;
        return NextResponse.json({ 
          room, 
          timeRemaining,
          pendingPlayers: room.pendingPlayers || {} 
        });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Room action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
