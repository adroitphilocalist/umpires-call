import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Contest } from '@/models/Contest';
import { Match } from '@/models/Match';
import { isTeamSelectionLocked } from '@/lib/match-lock';
import { verifyToken } from '@/lib/jwt';

function getRequesterUserId(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('auth-token='));

  if (!tokenCookie) return null;

  const token = decodeURIComponent(tokenCookie.substring('auth-token='.length));
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const requesterUserId = getRequesterUserId(request);
    if (!requesterUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { teamId, userId } = await request.json();

    if (!userId || String(userId) !== requesterUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized contest join attempt' },
        { status: 403 }
      );
    }
    
    const contest = await Contest.findById(params.id);
    
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }

    const match = contest.matchId ? await Match.findById(contest.matchId).lean() as any : null;
    if (!match?.date) {
      return NextResponse.json(
        { success: false, error: 'Match not found for contest' },
        { status: 404 }
      );
    }

    if (isTeamSelectionLocked(new Date(match.date), match.status)) {
      return NextResponse.json(
        { success: false, error: 'Contest join is locked because the match has started' },
        { status: 403 }
      );
    }
    
    if (contest.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'Contest is not open for joining' },
        { status: 400 }
      );
    }
    
    if (contest.participants.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'Already joined this contest' },
        { status: 400 }
      );
    }
    
    if (contest.participants.length >= contest.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Contest is full' },
        { status: 400 }
      );
    }
    
    contest.participants.push(userId);
    
    if (contest.participants.length >= contest.maxParticipants) {
      contest.status = 'filled';
    }
    
    await contest.save();
    
    return NextResponse.json({
      success: true,
      message: 'Successfully joined contest',
    });
  } catch (error) {
    console.error('Error joining contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join contest' },
      { status: 500 }
    );
  }
}