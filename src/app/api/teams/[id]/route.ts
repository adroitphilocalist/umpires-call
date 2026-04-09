import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Team, ITeam } from '@/models/Team';
import { Contest } from '@/models/Contest';
import { Match } from '@/models/Match';
import { isTeamSelectionLocked } from '@/lib/match-lock';
import { verifyToken } from '@/lib/jwt';

type TeamDocument = mongoose.Require_id<ITeam>;

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const team = await Team.findById(params.id).lean().exec() as TeamDocument | null;
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      team: {
        ...team,
        _id: team._id.toString(),
        userId: team.userId?.toString(),
        contestId: team.contestId?.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    const data = await request.json();

    const existingTeam = await Team.findById(params.id).lean().exec() as TeamDocument | null;
    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    if (String(existingTeam.userId) !== requesterUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized team edit attempt' },
        { status: 403 }
      );
    }

    const contest = await Contest.findById(existingTeam.contestId).lean() as any;
    const match = contest?.matchId ? await Match.findById(contest.matchId).lean() as any : null;

    if (!match?.date) {
      return NextResponse.json(
        { success: false, error: 'Match not found for this team contest' },
        { status: 404 }
      );
    }

    if (isTeamSelectionLocked(new Date(match.date), match.status)) {
      return NextResponse.json(
        { success: false, error: 'Team editing is locked because the match has started' },
        { status: 403 }
      );
    }
    
    const team = await Team.findByIdAndUpdate(
      params.id,
      {
        $set: {
          name: data.name,
          players: data.players,
          totalCredits: data.totalCredits,
          captainId: data.captainId,
          viceCaptainId: data.viceCaptainId,
        },
      },
      { new: true }
    ).lean().exec() as TeamDocument | null;
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      team: {
        ...team,
        _id: team._id.toString(),
        userId: team.userId?.toString(),
        contestId: team.contestId?.toString(),
        captainId: team.captainId?.toString(),
        viceCaptainId: team.viceCaptainId?.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const team = await Team.findByIdAndDelete(params.id);
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Team deleted',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}