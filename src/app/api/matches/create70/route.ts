import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

const TEAM_SHORT_MAP: Record<string, string> = {
  'Sunrisers Hyderabad': 'SRH',
  'Royal Challengers Bengaluru': 'RCB',
  'Kolkata Knight Riders': 'KKR',
  'Mumbai Indians': 'MI',
  'Chennai Super Kings': 'CSK',
  'Rajasthan Royals': 'RR',
  'Gujarat Titans': 'GT',
  'Punjab Kings': 'PBKS',
  'Delhi Capitals': 'DC',
  'Lucknow Super Giants': 'LSG',
};

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