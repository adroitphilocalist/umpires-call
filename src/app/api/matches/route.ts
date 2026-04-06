import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

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

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const matchesWithComputedStatus = matches.map((m) => {
      // If DB status is explicitly 'completed', always show as completed
      if (m.status === 'completed') {
        return { ...m, status: 'completed' as const };
      }

      // If DB status is 'live', check if match date has passed
      // If match date is in the past, auto-complete it
      const matchDate = new Date(m.date);
      if (m.status === 'live' && matchDate < startOfToday) {
        return { ...m, status: 'completed' as const };
      }

      // If match date is in the past and not 'live', it's completed
      if (matchDate < startOfToday) {
        return { ...m, status: 'completed' as const };
      }

      // Otherwise it's upcoming
      return { ...m, status: 'upcoming' as const };
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