import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

// Helper function to determine match status based on time
function getMatchStatus(matchDate: Date, dbStatus?: string): 'completed' | 'live' | 'upcoming' {
  const now = new Date();
  const matchTime = new Date(matchDate);

  // If explicitly set to completed in DB, always completed
  if (dbStatus === 'completed') {
    return 'completed';
  }

  // Calculate time difference in hours
  const timeDiffMs = now.getTime() - matchTime.getTime();
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

  // If match started 5 or more hours ago → completed
  if (timeDiffHours >= 5) {
    return 'completed';
  }

  // If match has started but less than 5 hours ago → live
  if (timeDiffHours >= 0) {
    return 'live';
  }

  // If match hasn't started yet → upcoming
  return 'upcoming';
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { matchId, scorecardUrl, cricbuzzId } = data;

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'matchId is required' },
        { status: 400 }
      );
    }

    const updateFields: { [key: string]: string } = {};
    if (scorecardUrl !== undefined) {
      updateFields.scorecardUrl = scorecardUrl;
    }
    if (cricbuzzId !== undefined) {
      updateFields.cricbuzzId = cricbuzzId;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const match = await Match.findByIdAndUpdate(
      matchId,
      { $set: updateFields },
      { new: true }
    );

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Compute the status based on time (same logic as in matches API)
    const computedStatus = getMatchStatus(match.date, match.status);

    return NextResponse.json({
      success: true,
      match: {
        ...match.toObject(),
        _id: match._id.toString(),
        status: computedStatus, // Return computed status, not raw DB status
      },
    });
  } catch (error) {
    console.error('Error updating scorecard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scorecard' },
      { status: 500 }
    );
  }
}