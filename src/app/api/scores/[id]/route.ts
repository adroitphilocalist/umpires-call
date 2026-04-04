import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Contest } from '@/models/Contest';
import { Team } from '@/models/Team';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const contest = await Contest.findById(params.id).lean();

    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }

    const teams = await Team.find({ contestId: params.id })
      .populate('userId', 'displayName username avatar')
      .sort({ score: -1 })
      .lean();

    const rankedTeams = teams.map((team, index) => ({
      _id: team._id.toString(),
      name: team.name,
      score: team.score,
      rank: index + 1,
      user: team.userId ? {
        _id: (team.userId as any)._id?.toString(),
        displayName: (team.userId as any).displayName,
        username: (team.userId as any).username,
        avatar: (team.userId as any).avatar,
      } : undefined,
      players: team.players.map((player) => ({
        playerId: player.playerId?.toString(),
        name: player.name,
        role: player.role,
        creditCost: player.creditCost,
        image: player.image,
      })),
      captainId: team.captainId.toString(),
      viceCaptainId: team.viceCaptainId.toString(),
      totalCredits: team.totalCredits,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      contest: {
        _id: contest._id.toString(),
        name: contest.name,
        description: contest.description,
        matchId: contest.matchId.toString(),
        entryFee: contest.entryFee,
        maxParticipants: contest.maxParticipants,
        prizePool: contest.prizePool,
        status: contest.status,
        startTime: contest.startTime,
        endTime: contest.endTime,
        participantCount: contest.participants?.length || 0,
      },
      teams: rankedTeams,
    });
  } catch (error) {
    console.error('Error fetching contest scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contest scores' },
      { status: 500 }
    );
  }
}
