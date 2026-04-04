import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Contest } from '@/models/Contest';
import { IMatchScoreStats } from '@/models/MatchScore';
import { ITeam } from '@/models/Team';
import {
  updatePlayerScore,
  calculateTeamScores,
  getLeaderboard,
} from '@/lib/live-scoring';
import mongoose from 'mongoose';

interface PlayerPointsPayload {
  externalId: string;
  points: number;
  stats: IMatchScoreStats;
}

interface RequestBody {
  matchId: string;
  playerPoints: PlayerPointsPayload[];
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body: RequestBody = await request.json();

    const { matchId, playerPoints } = body;

    if (!matchId || !playerPoints || !Array.isArray(playerPoints)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid matchId format' },
        { status: 400 }
      );
    }

    for (const pp of playerPoints) {
      if (!pp.externalId || typeof pp.points !== 'number' || !pp.stats) {
        return NextResponse.json(
          { success: false, error: 'Invalid playerPoints format' },
          { status: 400 }
        );
      }
    }

    const updatedScores = await updatePlayerScore(matchId, playerPoints);

    await calculateTeamScores(matchId);

    const contest = await Contest.findOne({
      matchId: new mongoose.Types.ObjectId(matchId),
    });

    let leaderboard: ITeam[] = [];
    if (contest) {
      leaderboard = await getLeaderboard(contest._id.toString());
    }

    return NextResponse.json({
      success: true,
      data: {
        matchId,
        playerScores: updatedScores.map((s) => ({
          _id: s._id.toString(),
          externalId: s.externalId,
          points: s.points,
          stats: s.stats,
          lastUpdated: s.lastUpdated,
        })),
        leaderboard: leaderboard.map((t: any) => ({
          _id: t._id.toString(),
          teamName: t.name,
          score: t.score,
          rank: t.rank,
        })),
      },
    });
  } catch (error) {
    console.error('Error updating scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scores' },
      { status: 500 }
    );
  }
}