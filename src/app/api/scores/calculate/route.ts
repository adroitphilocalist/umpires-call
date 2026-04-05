import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { updatePlayerScore, calculateTeamScores, getLeaderboard } from '@/lib/live-scoring';
import { Match } from '@/models/Match';
import { Contest } from '@/models/Contest';
import { Team, ITeam } from '@/models/Team';

interface CricbuzzScorecard {
  scoreCard?: Array<{
    batTeamDetails?: {
      batsmenData?: Record<string, {
        batId?: number;
        batName?: string;
        runs?: number;
        balls?: number;
        fours?: number;
        sixes?: number;
        strikeRate?: number;
        fielderId1?: number;
        fielderId2?: number;
      }>;
    };
    bowlTeamDetails?: {
      bowlersData?: Record<string, {
        bowlerId?: number;
        bowlName?: string;
        overs?: string | number;
        maidens?: number;
        runs?: number;
        wickets?: number;
        economy?: number;
      }>;
    };
  }>;
}

function parseOvers(overs: string | number): number {
  if (typeof overs === 'number') return overs;
  if (!overs) return 0;
  
  const parts = String(overs).split('.');
  if (parts.length === 2) {
    return parseInt(parts[0]) + parseInt(parts[1]) / 6;
  }
  return parseFloat(overs) || 0;
}

function calculateBattingPoints(
  runs: number,
  balls: number,
  fours: number,
  sixes: number,
  strikeRate: number
): number {
  let points = runs + (fours * 4) + (sixes * 6);

  if (runs >= 100) {
    points += 16;
  } else if (runs >= 50) {
    points += 8;
  }

  if (runs === 0 && balls > 0) {
    points -= 2;
  }

  if (balls >= 10) {
    if (strikeRate >= 170) {
      points += 6;
    } else if (strikeRate >= 150) {
      points += 4;
    } else if (strikeRate >= 130) {
      points += 2;
    } else if (strikeRate < 50) {
      points -= 6;
    } else if (strikeRate < 60) {
      points -= 4;
    } else if (strikeRate < 70) {
      points -= 2;
    }
  }

  return Math.max(0, points);
}

function calculateBowlingPoints(
  wickets: number,
  overs: number,
  economy: number
): number {
  let points = wickets * 30;

  if (wickets >= 5) {
    points += 12;
  } else if (wickets >= 4) {
    points += 8;
  } else if (wickets >= 3) {
    points += 4;
  }

  if (overs >= 2) {
    if (economy <= 5) {
      points += 6;
    } else if (economy <= 6) {
      points += 4;
    } else if (economy <= 7) {
      points += 2;
    } else if (economy >= 12) {
      points -= 6;
    } else if (economy >= 11) {
      points -= 4;
    } else if (economy >= 10) {
      points -= 2;
    }
  }

  return Math.max(0, points);
}

async function fetchScorecard(scorecardUrl: string): Promise<CricbuzzScorecard | null> {
  try {
    const response = await fetch(scorecardUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch scorecard:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scorecard:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { matchId, scorecardUrl } = data;

    if (!matchId || !scorecardUrl) {
      return NextResponse.json(
        { success: false, error: 'matchId and scorecardUrl are required' },
        { status: 400 }
      );
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    const scorecardData = await fetchScorecard(scorecardUrl);
    if (!scorecardData || !scorecardData.scoreCard) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scorecard data' },
        { status: 500 }
      );
    }

    const playerPointsMap: Map<string, { points: number; stats: any }> = new Map();
    const fieldingMap: Map<string, number> = new Map();

    for (const innings of scorecardData.scoreCard || []) {
      const batsmenData = innings.batTeamDetails?.batsmenData || {};
      const bowlersData = innings.bowlTeamDetails?.bowlersData || {};

      for (const [, batsman] of Object.entries(batsmenData)) {
        if (!batsman.batId || batsman.runs === undefined) continue;
        
        const externalId = String(batsman.batId);
        const battingPoints = calculateBattingPoints(
          batsman.runs || 0,
          batsman.balls || 0,
          batsman.fours || 0,
          batsman.sixes || 0,
          batsman.strikeRate || 0
        );

        const existing = playerPointsMap.get(externalId) || {
          points: 0,
          stats: {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            wickets: 0,
            overs: 0,
            maiden: 0,
            economy: 0,
            catches: 0,
            runOuts: 0,
          },
        };

        existing.stats.runs += batsman.runs || 0;
        existing.stats.balls += batsman.balls || 0;
        existing.stats.fours += batsman.fours || 0;
        existing.stats.sixes += batsman.sixes || 0;
        existing.points += battingPoints;

        if (batsman.fielderId1) {
          const fielderId = String(batsman.fielderId1);
          fieldingMap.set(fielderId, (fieldingMap.get(fielderId) || 0) + 1);
        }
        if (batsman.fielderId2) {
          const fielderId = String(batsman.fielderId2);
          fieldingMap.set(fielderId, (fieldingMap.get(fielderId) || 0) + 0.5);
        }

        playerPointsMap.set(externalId, existing);
      }

      for (const [, bowler] of Object.entries(bowlersData)) {
        if (!bowler.bowlerId || bowler.wickets === undefined) continue;

        const externalId = String(bowler.bowlerId);
        const overs = parseOvers(bowler.overs || '0');
        const bowlingPoints = calculateBowlingPoints(
          bowler.wickets || 0,
          overs,
          bowler.economy || 0
        );

        const existing = playerPointsMap.get(externalId) || {
          points: 0,
          stats: {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            wickets: 0,
            overs: 0,
            maiden: 0,
            economy: 0,
            catches: 0,
            runOuts: 0,
          },
        };

        existing.stats.wickets += bowler.wickets || 0;
        existing.stats.overs += overs;
        existing.stats.maiden += bowler.maidens || 0;
        existing.stats.economy = bowler.economy || 0;
        existing.points += bowlingPoints;

        playerPointsMap.set(externalId, existing);
      }
    }

    const fieldingEntries = Array.from(fieldingMap.entries());
    for (const [fielderId, catchCount] of fieldingEntries) {
      const existing = playerPointsMap.get(fielderId);
      if (existing) {
        existing.stats.catches += catchCount;
        existing.points += catchCount * 8;
        playerPointsMap.set(fielderId, existing);
      }
    }

    const playerPointsArray = Array.from(playerPointsMap.entries()).map(([externalId, data]) => ({
      externalId,
      points: data.points,
      stats: data.stats,
    }));

    const updatedScores = await updatePlayerScore(matchId, playerPointsArray);

    const updatedTeams = await calculateTeamScores(matchId);

    const matchObjectId = new mongoose.Types.ObjectId(matchId);
    const contest = await Contest.findOne({ matchId: matchObjectId });
    let leaderboard: ITeam[] = [];
    if (contest) {
      leaderboard = await getLeaderboard(contest._id.toString());
    }

    return NextResponse.json({
      success: true,
      data: {
        matchId,
        playerScores: updatedScores.map((score) => ({
          _id: score._id.toString(),
          externalId: score.externalId,
          points: score.points,
          stats: score.stats,
        })),
        teams: updatedTeams.map((team) => ({
          _id: team._id.toString(),
          name: team.name,
          score: team.score,
        })),
        leaderboard: leaderboard.map((team: ITeam) => ({
          _id: team._id.toString(),
          name: team.name,
          score: team.score,
          rank: team.rank,
        })),
      },
    });
  } catch (error) {
    console.error('Error calculating scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate scores' },
      { status: 500 }
    );
  }
}