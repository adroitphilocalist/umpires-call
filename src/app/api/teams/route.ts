import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { User } from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contestId = searchParams.get('contestId');
    
    const query: any = {};
    if (userId) query.userId = userId;
    if (contestId) query.contestId = contestId;
    
    const teams = await Team.find(query)
      .sort({ score: -1 })
      .lean() as unknown as Array<{
      _id: { toString(): string };
      userId: { toString(): string };
      contestId?: { toString(): string };
      name: string;
      score?: number;
      captainId: { toString(): string };
      viceCaptainId: { toString(): string };
      players: Array<{
        playerId: { toString(): string };
        name: string;
        role: string;
        creditCost: number;
      }>;
    }>;
    
    const teamsWithUser = await Promise.all(
      teams.map(async (t) => {
        const user = await User.findById(t.userId).lean() as unknown as {
          _id: { toString(): string };
          displayName: string;
        } | null;
        return {
          ...t,
          _id: t._id.toString(),
          userId: t.userId.toString(),
          contestId: t.contestId?.toString(),
          captainId: t.captainId.toString(),
          viceCaptainId: t.viceCaptainId.toString(),
          players: t.players.map(p => ({
            playerId: p.playerId.toString(),
            name: p.name,
            role: p.role,
            creditCost: p.creditCost,
          })),
          user: user ? {
            _id: user._id.toString(),
            displayName: user.displayName,
          } : null,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      teams: teamsWithUser,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    const existingTeam = await Team.findOne({
      userId: data.userId,
      contestId: data.contestId,
    });
    
    if (existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team already exists for this contest' },
        { status: 400 }
      );
    }
    
    const team = await Team.create({
      userId: data.userId,
      contestId: data.contestId,
      name: data.name,
      players: data.players,
      totalCredits: data.totalCredits,
      captainId: data.captainId,
      viceCaptainId: data.viceCaptainId,
      score: 0,
      rank: 0,
    });
    
    return NextResponse.json({
      success: true,
      team: {
        ...team.toObject(),
        _id: team._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
}