import { NextRequest, NextResponse } from 'next/server';
import { Liveblocks } from '@liveblocks/node';

interface AuthRequest {
  room?: string;
  userId: string;
  userName: string;
  userColor: string;
}

function getLiveblocks() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error('LIVEBLOCKS_SECRET_KEY is not configured');
  }
  return new Liveblocks({ secret });
}

export async function POST(request: NextRequest) {
  try {
    const liveblocks = getLiveblocks();
    
    let body: AuthRequest;
    try {
      body = (await request.json()) as AuthRequest;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    const { room, userId, userName, userColor } = body;

    if (!userId || !userName || !userColor) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userName, userColor' },
        { status: 400 }
      );
    }

    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        color: userColor,
      },
    });

    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    const { status, body: responseBody } = await session.authorize();
    
    return new NextResponse(responseBody, { status });
  } catch (error) {
    console.error('Liveblocks auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
