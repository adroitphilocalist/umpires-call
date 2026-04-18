import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';
import { Contest } from '@/models/Contest';
import { Team } from '@/models/Team';
import { Player } from '@/models/Player';
import { MatchScore, IMatchScoreStats } from '@/models/MatchScore';
import { TeamFinalResult } from '@/models/TeamFinalResult';
import { ContestFinalResult } from '@/models/ContestFinalResult';
import { User } from '@/models/User';
import { TeamPlayerFinalResult } from '@/models/TeamPlayerFinalResult';
import { MatchPlayerFinalScoreSnapshot } from '@/models/MatchPlayerFinalScoreSnapshot';
import { FinalizationRun } from '@/models/FinalizationRun';
import { verifyToken } from '@/lib/jwt';
import { buildDetailedBreakdown } from '@/lib/contest-scoring';

const ADMIN_PHONE = '+916291299136';
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

interface AuthPayload {
  userId: string;
  phone: string;
  email: string;
  displayName: string;
}

interface FinalizeRequestBody {
  matchId?: string;
  contestId?: string;
  force?: boolean;
}

interface IPlayerPointsBreakdown {
  category: string;
  description: string;
  points: number;
}

interface LeanMatchScore {
  matchId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  externalId: string;
  points: number;
  stats?: Partial<IMatchScoreStats>;
}

interface TeamPlayerComputation {
  playerId: mongoose.Types.ObjectId;
  externalId: string;
  playerName: string;
  role: string;
  creditCost: number;
  basePoints: number;
  finalPoints: number;
  multiplier: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  breakdown: IPlayerPointsBreakdown[];
  stats: IMatchScoreStats;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

const toNum = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toStatsSnapshot = (stats?: Partial<IMatchScoreStats>): IMatchScoreStats => ({
  runs: toNum(stats?.runs),
  balls: toNum(stats?.balls),
  dots: toNum(stats?.dots),
  fours: toNum(stats?.fours),
  sixes: toNum(stats?.sixes),
  strikeRate: toNum(stats?.strikeRate),
  wickets: toNum(stats?.wickets),
  overs: toNum(stats?.overs),
  maiden: toNum(stats?.maiden),
  economy: toNum(stats?.economy),
  catches: toNum(stats?.catches),
  runOuts: toNum(stats?.runOuts),
  stumpings: toNum(stats?.stumpings),
  lbwBowled: toNum(stats?.lbwBowled),
  playingXI: toNum(stats?.playingXI),
  substitute: toNum(stats?.substitute),
});

function getMatchStatus(matchDate: Date, dbStatus?: string): 'completed' | 'live' | 'upcoming' {
  const now = new Date();
  const normalizedMatchTime = new Date(matchDate);

  if (dbStatus === 'completed') {
    return 'completed';
  }

  if (now < normalizedMatchTime) {
    return 'upcoming';
  }

  const endTime = new Date(normalizedMatchTime.getTime() + FIVE_HOURS_MS);
  if (now < endTime) {
    return 'live';
  }

  return 'completed';
}

function getAuthPayload(request: Request): AuthPayload | null {
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  const cookieHeader = request.headers.get('cookie') || '';
  const tokenCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('auth-token='));

  const cookieToken = tokenCookie
    ? decodeURIComponent(tokenCookie.substring('auth-token='.length))
    : '';

  const token = bearerToken || cookieToken;
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return payload as AuthPayload;
}

function buildBreakdown(
  stats: IMatchScoreStats,
  basePoints: number,
  isCaptain: boolean,
  isViceCaptain: boolean
): IPlayerPointsBreakdown[] {
  const breakdown = buildDetailedBreakdown(stats, basePoints).map((item) => ({
    category: item.category,
    description: item.description,
    points: round2(toNum(item.points)),
  }));

  const multiplier = isCaptain ? 2 : isViceCaptain ? 1.5 : 1;
  const finalPoints = round2(basePoints * multiplier);
  const multiplierBonus = round2(finalPoints - basePoints);

  if (multiplierBonus !== 0) {
    breakdown.push({
      category: 'Multiplier',
      description: isCaptain ? 'Captain (2x)' : 'Vice-captain (1.5x)',
      points: multiplierBonus,
    });
  }

  if (breakdown.length === 0) {
    breakdown.push({ category: 'Other', description: 'Base fantasy points', points: round2(basePoints) });
  }

  return breakdown;
}

async function runWithOptionalTransaction(
  work: (session: mongoose.ClientSession | null) => Promise<void>
) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await work(session);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const transactionUnsupported = message.includes(
      'Transaction numbers are only allowed on a replica set member or mongos'
    );

    if (transactionUnsupported) {
      await work(null);
      return;
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const auth = getAuthPayload(request);
    if (!auth || auth.phone !== ADMIN_PHONE) {
      return NextResponse.json(
        { success: false, error: 'Only admin can view finalization status' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const contestId = searchParams.get('contestId');

    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        { success: false, error: 'Valid matchId is required' },
        { status: 400 }
      );
    }

    const matchObjectId = new mongoose.Types.ObjectId(matchId);
    const contestFilter: Record<string, unknown> = { matchId: matchObjectId };

    if (contestId) {
      if (!mongoose.Types.ObjectId.isValid(contestId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid contestId format' },
          { status: 400 }
        );
      }
      contestFilter._id = new mongoose.Types.ObjectId(contestId);
    }

    const contests = await Contest.find(contestFilter).lean<any[]>();
    const contestIds = contests.map((contest) => contest._id);

    const finalResults = await ContestFinalResult.find({ contestId: { $in: contestIds } })
      .sort({ completedAt: -1 })
      .lean<any[]>();

    const latestRun = await FinalizationRun.findOne({
      matchId: matchObjectId,
      ...(contestId ? { contestId: new mongoose.Types.ObjectId(contestId) } : {}),
    })
      .sort({ startedAt: -1 })
      .lean<any>();

    return NextResponse.json({
      success: true,
      data: {
        matchId,
        contestId: contestId || null,
        totalContests: contests.length,
        savedContests: finalResults.filter((row) => row.isSaved).length,
        finalizedContests: finalResults.map((row) => ({
          contestId: String(row.contestId),
          contestName: row.contestName,
          isSaved: row.isSaved,
          totalTeams: row.totalTeams,
          completedAt: row.completedAt,
          finalizationVersion: row.finalizationVersion || 1,
          finalizedByPhone: row.finalizedByPhone || '',
        })),
        latestRun: latestRun
          ? {
              _id: String(latestRun._id),
              status: latestRun.status,
              startedAt: latestRun.startedAt,
              completedAt: latestRun.completedAt,
              summary: latestRun.summary,
              errorMessage: latestRun.errorMessage || '',
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching finalization status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch finalization status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let finalizationRunId: mongoose.Types.ObjectId | null = null;

  try {
    await dbConnect();

    const auth = getAuthPayload(request);
    if (!auth || auth.phone !== ADMIN_PHONE) {
      return NextResponse.json(
        { success: false, error: 'Only admin can save final match results' },
        { status: 403 }
      );
    }

    const body: FinalizeRequestBody = await request.json();
    const matchId = body.matchId;
    const contestId = body.contestId;
    const force = body.force === true;

    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        { success: false, error: 'Valid matchId is required' },
        { status: 400 }
      );
    }

    if (contestId && !mongoose.Types.ObjectId.isValid(contestId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contestId format' },
        { status: 400 }
      );
    }

    const matchObjectId = new mongoose.Types.ObjectId(matchId);
    const match = await Match.findById(matchObjectId).lean<any>();

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    const computedStatus = getMatchStatus(new Date(match.date), match.status);
    if (computedStatus !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Match is not completed yet. Finalization is allowed only after completion.' },
        { status: 400 }
      );
    }

    const contestFilter: Record<string, unknown> = { matchId: matchObjectId };
    if (contestId) {
      contestFilter._id = new mongoose.Types.ObjectId(contestId);
    }

    const contests = await Contest.find(contestFilter).lean<any[]>();
    if (contests.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contests found for this match' },
        { status: 404 }
      );
    }

    const run = await FinalizationRun.create({
      matchId: matchObjectId,
      contestId: contestId ? new mongoose.Types.ObjectId(contestId) : undefined,
      mode: contestId ? 'single' : 'all',
      status: 'running',
      triggeredByUserId:
        auth.userId && mongoose.Types.ObjectId.isValid(auth.userId)
          ? new mongoose.Types.ObjectId(auth.userId)
          : undefined,
      triggeredByPhone: auth.phone,
      startedAt: new Date(),
      summary: {
        totalContests: contests.length,
        savedContests: 0,
        skippedContests: 0,
        totalTeams: 0,
      },
    });
    finalizationRunId = run._id;

    const results: any[] = [];
    let totalTeamsSaved = 0;
    let savedContests = 0;
    let skippedContests = 0;

    await runWithOptionalTransaction(async (session) => {
      const dbOpts = session ? { session } : undefined;

      const matchScores = await MatchScore.find({ matchId: matchObjectId }, null, dbOpts).lean<LeanMatchScore[]>();
      const scoreByPlayerId = new Map<string, LeanMatchScore>();
      const scoreByExternalId = new Map<string, LeanMatchScore>();
      const allScorePlayerIds: mongoose.Types.ObjectId[] = [];

      for (const score of matchScores) {
        const key = String(score.playerId);
        scoreByPlayerId.set(key, score);
        if (score.externalId) {
          scoreByExternalId.set(String(score.externalId), score);
        }
        allScorePlayerIds.push(score.playerId);
      }

      const scorePlayers = await Player.find({ _id: { $in: allScorePlayerIds } }, null, dbOpts).lean<any[]>();
      const scorePlayerMap = new Map<string, any>();
      for (const player of scorePlayers) {
        scorePlayerMap.set(String(player._id), player);
      }

      if (matchScores.length > 0) {
        const snapshotOps = matchScores.map((score) => {
          const player = scorePlayerMap.get(String(score.playerId));
          return {
            updateOne: {
              filter: { matchId: matchObjectId, playerId: score.playerId },
              update: {
                $set: {
                  externalId: score.externalId || player?.externalId || '',
                  playerName: player?.name || '',
                  role: player?.role || '',
                  team: player?.team || '',
                  points: round2(score.points || 0),
                  stats: toStatsSnapshot(score.stats),
                  finalizedAt: new Date(),
                  finalizationRunId,
                },
              },
              upsert: true,
            },
          };
        });

        await MatchPlayerFinalScoreSnapshot.bulkWrite(snapshotOps, dbOpts);
      }

      for (const contest of contests) {
        const contestObjectId = new mongoose.Types.ObjectId(String(contest._id));
        const existingResult = await ContestFinalResult.findOne(
          { contestId: contestObjectId },
          null,
          dbOpts
        ).lean<any>();

        if (existingResult?.isSaved && !force) {
          skippedContests += 1;
          results.push({
            contestId: String(contest._id),
            contestName: contest.name,
            message: 'Already saved (use force=true to rebuild)',
            skipped: true,
          });
          continue;
        }

        await TeamPlayerFinalResult.deleteMany({ contestId: contestObjectId }, dbOpts);
        await TeamFinalResult.deleteMany({ contestId: contestObjectId }, dbOpts);

        const teams = await Team.find({ contestId: contestObjectId }, null, dbOpts).lean<any[]>();
        const userIds = Array.from(new Set(teams.map((team) => String(team.userId))))
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const users = await User.find({ _id: { $in: userIds } }, null, dbOpts).lean<any[]>();
        const userDisplayMap = new Map<string, string>();
        for (const user of users) {
          userDisplayMap.set(String(user._id), user.displayName || 'Unknown');
        }

        const processedTeams: Array<{
          teamId: mongoose.Types.ObjectId;
          teamName: string;
          userId: mongoose.Types.ObjectId;
          userName: string;
          totalPoints: number;
          players: TeamPlayerComputation[];
        }> = [];

        for (const team of teams) {
          const captainId = String(team.captainId);
          const viceCaptainId = String(team.viceCaptainId);
          let totalPoints = 0;
          const players: TeamPlayerComputation[] = [];

          for (const teamPlayer of team.players || []) {
            const playerId = new mongoose.Types.ObjectId(String(teamPlayer.playerId));
            const playerKey = String(playerId);
            const teamExternalId = String(teamPlayer.externalId || '');
            const score =
              scoreByPlayerId.get(playerKey) ||
              (teamExternalId ? scoreByExternalId.get(teamExternalId) : undefined);
            const resolvedPlayerId = score?.playerId
              ? new mongoose.Types.ObjectId(String(score.playerId))
              : playerId;

            const basePoints = round2(score?.points || 0);
            const isCaptain = playerKey === captainId;
            const isViceCaptain = playerKey === viceCaptainId;
            const multiplier = isCaptain ? 2 : isViceCaptain ? 1.5 : 1;
            const finalPoints = round2(basePoints * multiplier);
            const stats = toStatsSnapshot(score?.stats);
            const breakdown = buildBreakdown(stats, basePoints, isCaptain, isViceCaptain);

            totalPoints += finalPoints;
            players.push({
              playerId: resolvedPlayerId,
              externalId: teamExternalId || score?.externalId || '',
              playerName: teamPlayer.name,
              role: teamPlayer.role,
              creditCost: toNum(teamPlayer.creditCost),
              basePoints,
              finalPoints,
              multiplier,
              isCaptain,
              isViceCaptain,
              breakdown,
              stats,
            });
          }

          processedTeams.push({
            teamId: team._id,
            teamName: team.name,
            userId: team.userId,
            userName: userDisplayMap.get(String(team.userId)) || 'Unknown',
            totalPoints: round2(totalPoints),
            players,
          });
        }

        processedTeams.sort((a, b) => b.totalPoints - a.totalPoints);

        const contestFinalDoc = await ContestFinalResult.findOneAndUpdate(
          { contestId: contestObjectId },
          {
            $set: {
              matchId: matchObjectId,
              contestId: contestObjectId,
              contestName: contest.name,
              matchName: `${match.team1.shortName} vs ${match.team2.shortName}`,
              entryFee: contest.entryFee,
              prizePool: contest.prizePool,
              maxParticipants: contest.maxParticipants,
              completedAt: new Date(),
              totalTeams: processedTeams.length,
              isSaved: true,
              finalizationVersion: existingResult ? toNum(existingResult.finalizationVersion) + 1 : 1,
              finalizedByUserId:
                auth.userId && mongoose.Types.ObjectId.isValid(auth.userId)
                  ? new mongoose.Types.ObjectId(auth.userId)
                  : undefined,
              finalizedByPhone: auth.phone,
              finalizationRunId,
            },
          },
          {
            ...dbOpts,
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        ).lean<any>();

        if (contest.status !== 'completed') {
          await Contest.updateOne(
            { _id: contestObjectId },
            { $set: { status: 'completed' } },
            dbOpts
          );
        }

        const teamFinalDocs = processedTeams.map((teamRow, index) => ({
          matchId: matchObjectId,
          contestId: contestObjectId,
          contestFinalResultId: contestFinalDoc._id,
          userId: teamRow.userId,
          teamId: teamRow.teamId,
          teamName: teamRow.teamName,
          userName: teamRow.userName,
          totalPoints: teamRow.totalPoints,
          rank: index + 1,
          players: teamRow.players.map((playerRow) => ({
            playerId: playerRow.playerId,
            externalId: playerRow.externalId,
            playerName: playerRow.playerName,
            role: playerRow.role,
            creditCost: playerRow.creditCost,
            points: playerRow.finalPoints,
            multiplier: playerRow.multiplier,
            isCaptain: playerRow.isCaptain,
            isViceCaptain: playerRow.isViceCaptain,
            breakdown: playerRow.breakdown,
          })),
          finalizedAt: new Date(),
        }));

        const insertedTeamFinalDocs = teamFinalDocs.length > 0
          ? session
            ? await TeamFinalResult.insertMany(teamFinalDocs, { session })
            : await TeamFinalResult.insertMany(teamFinalDocs)
          : [];

        const playerFinalRows = insertedTeamFinalDocs.flatMap((teamDoc, index) => {
          const teamRow = processedTeams[index];
          return teamRow.players.map((playerRow) => ({
            matchId: matchObjectId,
            contestId: contestObjectId,
            contestFinalResultId: contestFinalDoc._id,
            teamFinalResultId: teamDoc._id,
            userId: teamRow.userId,
            teamId: teamRow.teamId,
            rankSnapshot: teamDoc.rank,
            playerId: playerRow.playerId,
            externalId: playerRow.externalId,
            playerName: playerRow.playerName,
            role: playerRow.role,
            creditCost: playerRow.creditCost,
            basePoints: playerRow.basePoints,
            finalPoints: playerRow.finalPoints,
            multiplier: playerRow.multiplier,
            isCaptain: playerRow.isCaptain,
            isViceCaptain: playerRow.isViceCaptain,
            stats: playerRow.stats,
            breakdown: playerRow.breakdown,
            finalizedAt: new Date(),
          }));
        });

        if (playerFinalRows.length > 0) {
          if (session) {
            await TeamPlayerFinalResult.insertMany(playerFinalRows, { session });
          } else {
            await TeamPlayerFinalResult.insertMany(playerFinalRows);
          }
        }

        totalTeamsSaved += processedTeams.length;
        savedContests += 1;

        const topTeam = processedTeams[0]
          ? {
              teamName: processedTeams[0].teamName,
              userName: processedTeams[0].userName,
              totalPoints: processedTeams[0].totalPoints,
              rank: 1,
            }
          : null;

        results.push({
          contestId: String(contest._id),
          contestName: contest.name,
          matchName: `${match.team1.shortName} vs ${match.team2.shortName}`,
          totalTeams: processedTeams.length,
          topTeam,
          skipped: false,
        });
      }
    });

    await FinalizationRun.findByIdAndUpdate(finalizationRunId, {
      $set: {
        status: 'completed',
        completedAt: new Date(),
        summary: {
          totalContests: contests.length,
          savedContests,
          skippedContests,
          totalTeams: totalTeamsSaved,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        runId: finalizationRunId?.toString() || null,
        totalContests: contests.length,
        savedContests,
        skippedContests,
        totalTeams: totalTeamsSaved,
        force,
      },
    });
  } catch (error) {
    if (finalizationRunId) {
      await FinalizationRun.findByIdAndUpdate(finalizationRunId, {
        $set: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(() => undefined);
    }

    console.error('Error saving final results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save final results' },
      { status: 500 }
    );
  }
}