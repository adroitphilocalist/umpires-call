import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Contest } from '@/models/Contest';

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    await dbConnect();
    
    // Try to find by _id or phone
    let user = await User.findById(params.uid).lean();
    
    if (!user) {
      user = await User.findOne({ phone: params.uid }).lean();
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        _id: user._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Handle /api/users/:uid/stats endpoint
export async function PUT(
  request: Request,
  { params }: { params: { uid: string } }
) {
  const url = new URL(request.url);
  const endpoint = url.pathname.split('/').pop();
  
  if (endpoint === 'stats') {
    return handleStats(params.uid);
  }
  
  if (endpoint === 'history') {
    return handleHistory(params.uid);
  }
  
  return NextResponse.json(
    { success: false, error: 'Invalid endpoint' },
    { status: 404 }
  );
}

async function handleStats(uid: string) {
  try {
    await dbConnect();
    
    let user = await User.findById(uid).lean();
    if (!user) {
      user = await User.findOne({ phone: uid }).lean();
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const teams = await Team.find({ userId: user._id.toString() }).lean();
    const contestsWon = teams.filter(t => t.rank === 1).length;
    const avgRank = teams.length > 0
      ? Math.round(teams.reduce((sum, t) => sum + (t.rank || 999), 0) / teams.length)
      : 0;
    
    return NextResponse.json({
      success: true,
      stats: {
        contestsJoined: teams.length,
        totalWins: contestsWon,
        avgRank,
        totalContests: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

async function handleHistory(uid: string) {
  try {
    await dbConnect();
    
    let user = await User.findById(uid).lean();
    if (!user) {
      user = await User.findOne({ phone: uid }).lean();
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const teams = await Team.find({ userId: user._id.toString() })
      .populate('contestId')
      .sort({ createdAt: -1 })
      .lean();
    
    const history = teams.map(t => ({
      _id: t._id.toString(),
      name: (t.contestId as any)?.name || 'Contest',
      rank: t.rank,
      score: t.score,
      prize: 0,
      date: t.createdAt,
    }));
    
    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}