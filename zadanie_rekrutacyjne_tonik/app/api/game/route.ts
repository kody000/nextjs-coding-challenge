import { NextRequest, NextResponse } from 'next/server';
import { pusherServer, getChannelName } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, roomId, data } = body;

    if (!event || !roomId) {
      return NextResponse.json({ error: 'Missing event or roomId' }, { status: 400 });
    }

    const channelName = getChannelName(roomId);
    
    await pusherServer.trigger(channelName, event, {
      ...data,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return NextResponse.json({ error: 'Failed to trigger event' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Game API ready' });
}
