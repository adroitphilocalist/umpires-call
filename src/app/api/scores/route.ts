import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { MatchScore, IMatchScore } from '@/models/MatchScore';
import { Team, ITeam } from '@/models/Team';
import { User } from '@/models/User';
import { Player, IPlayer } from '@/models/Player';
import { Match, IMatch } from '@/models/Match';
import { Contest } from '@/models/Contest';
import { TeamFinalResult, ITeamFinalResult, ITeamPlayerResult } from '@/models/TeamFinalResult';
import { ContestFinalResult } from '@/models/ContestFinalResult';

interface PopulatedMatchScore extends Omit<IMatchScore, 'playerId' | 'matchId'> {
  _id: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  playerId: IPlayer | null;
}

// Helper function to determine match status based on time
// If match started >= 5 hours ago → completed
// If match started < 5 hours ago but not yet → live
// If match hasn't started yet → upcoming
function getMatchStatus(matchDate: Date, dbStatus?: string): 'completed' | 'live' | 'upcoming' {
  const now = new Date();
  const matchTime = new Date(matchDate);

  // If explicitly set to completed in DB, always completed
  if (dbStatus === 'completed') {
    return 'completed';
  }

  // Calculate time difference in hours
  const timeDiffMs = now.getTime() - matchTime.getTime();
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

  // If match started 5 or more hours ago → completed
  if (timeDiffHours >= 5) {
    return 'completed';
  }

  // If match has started but less than 5 hours ago → live
  if (timeDiffHours >= 0) {
    return 'live';
  }

  // If match hasn't started yet → upcoming
  return 'upcoming';
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const contestId = searchParams.get('contestId');
    const forceLive = searchParams.get('forceLive') === 'true';

    if (!matchId && !contestId) {
      return NextResponse.json(
        { success: false, error: 'Either matchId or contestId is required' },
        { status: 400 }
      );
    }

    if (matchId) {
      // Get match to check if completed
      const match = await Match.findById(matchId).lean<IMatch>();

      // Determine match status using time-based logic
      const matchDate = new Date(match?.date || new Date());
      const computedStatus = getMatchStatus(matchDate, match?.status);
      const isMatchCompleted = computedStatus === 'completed';

      // If match is completed and has permanent results stored, use them
      if (isMatchCompleted && !forceLive) {
        const contestFinalResult = await ContestFinalResult.findOne({ matchId: new mongoose.Types.ObjectId(matchId) });

        if (contestFinalResult?.isSaved) {
          // Fetch from permanent storage
          const teamResults = await TeamFinalResult.find({
            contestId: contestFinalResult.contestId
          }).sort({ rank: 1 });

          const leaderboard = teamResults.map((team) => ({
            _id: team.teamId.toString(),
            teamFinalResultId: team._id.toString(),
            contestId: team.contestId.toString(),
            name: team.teamName,
            score: team.totalPoints,
            rank: team.rank,
            user: {
              _id: team.userId.toString(),
              displayName: team.userName,
            },
            players: team.players.map((p: ITeamPlayerResult) => ({
              playerId: p.playerId.toString(),
              name: p.playerName,
              role: p.role,
              creditCost: p.creditCost,
              points: p.points,
              multiplier: p.multiplier,
              isCaptain: p.isCaptain,
              isViceCaptain: p.isViceCaptain,
              breakdown: p.breakdown,
            })),
          }));

          return NextResponse.json({
            success: true,
            matchId,
            isCompleted: true,
            lastScoreUpdate: contestFinalResult.completedAt,
            isFromCache: true,
            leaderboard,
            scores: leaderboard.flatMap((t: any) =>
              t.players.map((p: any) => ({
                playerId: p.playerId,
                points: p.points,
                playerName: p.name,
              }))
            ),
          });
        }
      }

      // Otherwise, fetch live scores from MatchScore
      const scores = await MatchScore.find({ matchId: new mongoose.Types.ObjectId(matchId) })
        .populate({ path: 'playerId', model: Player })
        .sort({ points: -1 })
        .lean<PopulatedMatchScore[]>();

      return NextResponse.json({
        success: true,
        matchId,
        isCompleted: isMatchCompleted,
        lastScoreUpdate: match?.lastScoreUpdate || null,
        isFromCache: false,
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
      // Get the contest to check if match is completed
      const contest = await Contest.findById(contestId);
      const match = contest?.matchId
        ? await Match.findById(contest.matchId).lean<IMatch>()
        : null;

      const matchDate = new Date(match?.date || new Date());
      const computedStatus = getMatchStatus(matchDate, match?.status);
      const isMatchCompleted = computedStatus === 'completed';

      // If match is completed and has permanent results, use them
      if (isMatchCompleted && !forceLive) {
        const contestFinalResult = await ContestFinalResult.findOne({ contestId: new mongoose.Types.ObjectId(contestId) });

        if (contestFinalResult?.isSaved) {
          const teamResults = await TeamFinalResult.find({ contestId: new mongoose.Types.ObjectId(contestId) })
            .sort({ rank: 1 });

          const leaderboard = teamResults.map((team) => ({
            _id: team.teamId.toString(),
            teamFinalResultId: team._id.toString(),
            contestId: team.contestId.toString(),
            name: team.teamName,
            score: team.totalPoints,
            rank: team.rank,
            user: {
              _id: team.userId.toString(),
              displayName: team.userName,
            },
            players: team.players.map((p: ITeamPlayerResult) => ({
              playerId: p.playerId.toString(),
              name: p.playerName,
              role: p.role,
              creditCost: p.creditCost,
              points: p.points,
              multiplier: p.multiplier,
              isCaptain: p.isCaptain,
              isViceCaptain: p.isViceCaptain,
              breakdown: p.breakdown,
            })),
          }));

          return NextResponse.json({
            success: true,
            contestId,
            isCompleted: true,
            isFromCache: true,
            lastScoreUpdate: contestFinalResult.completedAt,
            leaderboard,
          });
        }
      }

      // Otherwise, fetch from live Team collection
      const teams = await Team.find<ITeam>({ contestId: new mongoose.Types.ObjectId(contestId) })
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
        isCompleted: isMatchCompleted,
        isFromCache: false,
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
