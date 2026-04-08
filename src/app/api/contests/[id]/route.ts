import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Contest, IContest } from '@/models/Contest';
import { Match } from '@/models/Match';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const contest = await Contest.findById(params.id).lean<IContest & { matchId?: any }>();

    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }

    const rawMatchId = contest.matchId ? String(contest.matchId) : undefined;
    const match = rawMatchId ? await Match.findById(rawMatchId).lean<any>() : null;

    return NextResponse.json({
      success: true,
      contest: {
        ...contest,
        _id: String(contest._id),
        matchId: rawMatchId,
        match: match
          ? {
              ...match,
              _id: String(match._id),
            }
          : undefined,
        participantCount: contest.participants?.length || 0,
        inviteCode: contest.inviteCode,
      },
    });
  } catch (error) {
    console.error('Error fetching contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contest' },
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

    const data = await request.json();

    const contest = await Contest.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true }
    ).lean<IContest>();

    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contest: {
        ...contest,
        _id: String(contest._id),
      },
    });
  } catch (error) {
    console.error('Error updating contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contest' },
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
    
    const contest = await Contest.findByIdAndDelete(params.id);
    
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Contest deleted',
    });
  } catch (error) {
    console.error('Error deleting contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contest' },
      { status: 500 }
    );
  }
}