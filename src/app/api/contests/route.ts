import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Contest } from '@/models/Contest';
import { Match } from '@/models/Match';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const matchId = searchParams.get('matchId');
    const userId = searchParams.get('userId');
    const inviteCode = searchParams.get('inviteCode');
    
    const query: any = {};
    if (status) query.status = status;
    if (matchId) query.matchId = matchId;
    if (userId) query.participants = userId;
    if (inviteCode) query.inviteCode = inviteCode.toUpperCase();
    
    const contests = await Contest.find(query)
      .populate('matchId')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    return NextResponse.json({
      success: true,
      contests: contests.map(c => ({
        ...c,
        _id: c._id.toString(),
        matchId: c.matchId?._id?.toString(),
        match: c.matchId ? {
          ...c.matchId,
          _id: c.matchId._id.toString(),
        } : undefined,
        participantCount: c.participants?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    const contest = await Contest.create({
      name: data.name,
      description: data.description,
      matchId: data.matchId,
      entryFee: data.entryFee,
      maxParticipants: data.maxParticipants,
      prizePool: data.prizePool || data.entryFee * data.maxParticipants,
      creatorId: data.creatorId,
      participants: data.creatorId ? [data.creatorId] : [],
      status: 'open',
      startTime: data.startTime,
      endTime: data.endTime,
      inviteCode: generateInviteCode(),
    });
    
    return NextResponse.json({
      success: true,
      contest: {
        ...contest.toObject(),
        _id: contest._id.toString(),
        participantCount: 1,
      },
    });
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contest' },
      { status: 500 }
    );
  }
}