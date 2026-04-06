import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { MatchScore, IMatchScore } from '@/models/MatchScore';
import { Team, ITeam } from '@/models/Team';
import { User } from '@/models/User';
import { Player, IPlayer } from '@/models/Player';
import { Match } from '@/models/Match';

interface PopulatedMatchScore extends Omit<IMatchScore, 'playerId' | 'matchId'> {
  _id: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  playerId: IPlayer | null;
}

interface PopulatedMatch extends mongoose.Document {
  lastScoreUpdate?: Date;
}

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
        .populate({ path: 'playerId', model: Player })
        .sort({ points: -1 })
        .lean<PopulatedMatchScore[]>();

      // Get match to retrieve lastScoreUpdate
      const match = await Match.findById(matchId).lean<PopulatedMatch>();

      return NextResponse.json({
        success: true,
        matchId,
        lastScoreUpdate: match?.lastScoreUpdate || null,
        scores: scores.map((score) => ({
          _id: score._id.toString(),
          matchId: score.matchId.toString(),
          playerId: score.playerId?._id?.toString(),
          externalId: score.externalId,
          points: score.points,
          stats: score.stats,
          lastUpdated: score.lastUpdated,
          player: score.playerId ? {
            _id: score.playerId._id.toString(),
            name: score.playerId.name,
            role: score.playerId.role,
            team: score.playerId.team,
            creditValue: score.playerId.creditValue,
            image: score.playerId.image,
          } : undefined,
        })),
      });
    }

    if (contestId) {
      const teams = await Team.find<ITeam>({ contestId })
        .populate({ path: 'userId', model: User, select: 'displayName username avatar' })
        .sort({ score: -1 })
        .lean<ITeam[]>();

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
