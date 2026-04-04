import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    
    const query: any = { status: 'live' };
    if (matchId) query._id = matchId;
    
    const matches = await Match.find(query).lean();
    
    const scores = matches.map(m => ({
      matchId: m._id.toString(),
      team1: m.team1,
      team2: m.team2,
      score: m.liveScore,
      status: m.status,
    }));
    
    return NextResponse.json({
      success: true,
      scores,
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    const match = await Match.findByIdAndUpdate(
      data.matchId,
      {
        $set: {
          'liveScore.team1Score': data.team1Score,
          'liveScore.team2Score': data.team2Score,
          'liveScore.team1Wickets': data.team1Wickets,
          'liveScore.team2Wickets': data.team2Wickets,
          'liveScore.team1Overs': data.team1Overs,
          'liveScore.team2Overs': data.team2Overs,
          'liveScore.battingTeam': data.battingTeam,
          status: data.status || 'live',
        },
      },
      { new: true }
    ).lean();
    
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      score: match.liveScore,
    });
  } catch (error) {
    console.error('Error updating score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update score' },
      { status: 500 }
    );
  }
}