import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Helper function to determine match status based on time
function getMatchStatus(matchDate: Date, dbStatus?: string): 'completed' | 'live' | 'upcoming' {
  const now = new Date();
  const rawMatchTime = new Date(matchDate);
  const normalizedMatchTime = new Date(rawMatchTime.getTime() - IST_OFFSET_MS);

  // If explicitly set to completed in DB, always completed
  if (dbStatus === 'completed') {
    return 'completed';
  }

  if (now < normalizedMatchTime) {
    return 'upcoming';
  }

  const endTime = new Date(normalizedMatchTime.getTime() + FIVE_HOURS_MS);

  if (now < endTime) {
    return 'live';
  }

  return 'completed';
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