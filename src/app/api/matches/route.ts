import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

// Helper function to determine match status based on time
// If match started >= 5 hours ago → completed
// If match started < 5 hours ago but has started → live
// If match hasn't started yet → upcoming
function getMatchStatus(matchDate: Date, dbStatus?: string): 'completed' | 'live' | 'upcoming' {
  const now = new Date();
  const normalizedMatchTime = new Date(matchDate);

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

    if (!data?.team1?.name || !data?.team2?.name || !data?.date) {
      return NextResponse.json(
        { success: false, error: 'team1.name, team2.name and date are required' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(data.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid match start date' },
        { status: 400 }
      );
    }

    const maxMatch = await Match.findOne()
      .sort({ matchNumber: -1 })
      .select('matchNumber')
      .lean<{ matchNumber?: number } | null>();
    const maxExistingMatchNumber = maxMatch?.matchNumber || 70;
    const computedMatchNumber =
      typeof data.matchNumber === 'number' && data.matchNumber > 70
        ? data.matchNumber
        : Math.max(70, maxExistingMatchNumber) + 1;
    
    const match = await Match.create({
      team1: {
        name: data.team1.name,
        shortName: data.team1.shortName || data.team1.name.slice(0, 3).toUpperCase(),
      },
      team2: {
        name: data.team2.name,
        shortName: data.team2.shortName || data.team2.name.slice(0, 3).toUpperCase(),
      },
      venue: data.venue || 'TBD',
      date: parsedDate,
      status: data.status || 'upcoming',
      format: data.format || 'T20',
      matchNumber: computedMatchNumber,
      cricbuzzId: data.cricbuzzId || undefined,
      scorecardUrl: data.scorecardUrl || undefined,
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