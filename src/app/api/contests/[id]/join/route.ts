import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Contest } from '@/models/Contest';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { teamId, userId } = await request.json();
    
    const contest = await Contest.findById(params.id);
    
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    if (contest.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'Contest is not open for joining' },
        { status: 400 }
      );
    }
    
    if (contest.participants.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'Already joined this contest' },
        { status: 400 }
      );
    }
    
    if (contest.participants.length >= contest.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Contest is full' },
        { status: 400 }
      );
    }
    
    contest.participants.push(userId);
    
    if (contest.participants.length >= contest.maxParticipants) {
      contest.status = 'filled';
    }
    
    await contest.save();
    
    return NextResponse.json({
      success: true,
      message: 'Successfully joined contest',
    });
  } catch (error) {
    console.error('Error joining contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join contest' },
      { status: 500 }
    );
  }
}