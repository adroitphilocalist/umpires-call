import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { MatchScore } from '@/models/MatchScore';
import { Team } from '@/models/Team';
import { User } from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const contestId = searchParams.get('contestId');

    if (!matchId && !contestId) {
      return NextResponse.json(
        { success: false, error: 'Either matchId or contestId is required' },
        { status: 400 }
      );
    }

    if (matchId) {
      const scores = await MatchScore.find({ matchId })
        .populate('playerId')
        .sort({ points: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        matchId,
        scores: scores.map((score) => ({
          _id: score._id.toString(),
          matchId: score.matchId.toString(),
          playerId: score.playerId?._id?.toString(),
          externalId: score.externalId,
          points: score.points,
          stats: score.stats,
          lastUpdated: score.lastUpdated,
          player: score.playerId ? {
            _id: (score.playerId as any)._id.toString(),
            name: (score.playerId as any).name,
            role: (score.playerId as any).role,
            team: (score.playerId as any).team,
            creditValue: (score.playerId as any).creditValue,
            image: (score.playerId as any).image,
          } : undefined,
        })),
      });
    }

    if (contestId) {
      const teams = await Team.find({ contestId })
        .populate('userId', 'displayName username avatar')
        .sort({ score: -1 })
        .lean();

      const leaderboard = teams.map((team, index) => ({
        _id: team._id.toString(),
        contestId: team.contestId.toString(),
        name: team.name,
        score: team.score,
        rank: index + 1,
        user: team.userId ? {
          _id: (team.userId as any)._id?.toString(),
          displayName: (team.userId as any).displayName,
          username: (team.userId as any).username,
          avatar: (team.userId as any).avatar,
        } : undefined,
        players: team.players,
        captainId: team.captainId.toString(),
        viceCaptainId: team.viceCaptainId.toString(),
      }));

      return NextResponse.json({
        success: true,
        contestId,
        leaderboard,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}
