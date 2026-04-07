import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Helper function to determine match status based on time
// If match started >= 5 hours ago → completed
// If match started < 5 hours ago but has started → live
// If match hasn't started yet → upcoming
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

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const format = searchParams.get('format');
    
    const query: any = {};
    if (format) query.format = format;
    
    const matches = await Match.find(query)
      .sort({ date: 1 }) // Oldest first (upcoming matches at top)
      .limit(100)
      .lean();

    const matchesWithComputedStatus = matches.map((m) => {
      const computedStatus = getMatchStatus(m.date, m.status);
      return { ...m, status: computedStatus };
    });

    const filteredMatches = status
      ? matchesWithComputedStatus.filter((m) => m.status === status)
      : matchesWithComputedStatus;
    
    return NextResponse.json({
      success: true,
      matches: filteredMatches.map(m => ({
        ...m,
        _id: String((m as any)._id),
      })),
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    const match = await Match.create({
      team1: data.team1,
      team2: data.team2,
      venue: data.venue,
      date: data.date,
      status: data.status || 'upcoming',
      format: data.format || 'T20',
      matchNumber: data.matchNumber,
      cricbuzzId: data.cricbuzzId,
      scorecardUrl: data.scorecardUrl,
    });
    
    return NextResponse.json({
      success: true,
      match: {
        ...match.toObject(),
        _id: match._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create match' },
      { status: 500 }
    );
  }
}