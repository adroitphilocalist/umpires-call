import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';
import { updateMatchStatuses } from '@/lib/match-status';

export async function GET(request: Request) {
  try {
    await dbConnect();

    await updateMatchStatuses();

    const matches = await Match.find({ status: 'live' })
      .sort({ date: 1 })
      .lean();

    const liveMatches = matches.map((m) => ({
      ...m,
      _id: String((m as any)._id),
      scorecardUrl: m.scorecardUrl,
      cricbuzzId: m.cricbuzzId,
    }));

    return NextResponse.json({
      success: true,
      matches: liveMatches,
    });
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live matches' },
      { status: 500 }
    );
  }
}