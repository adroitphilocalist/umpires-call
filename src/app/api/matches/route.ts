import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

// Helper function to determine match status based on time
// If match started >= 5 hours ago → completed
// If match started < 5 hours ago but has started → live
// If match hasn't started yet → upcoming
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