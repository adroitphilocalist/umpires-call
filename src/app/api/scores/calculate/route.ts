import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { updatePlayerScore, calculateTeamScores, getLeaderboard } from '@/lib/live-scoring';
import { Match } from '@/models/Match';
import { Contest } from '@/models/Contest';
import { Team, ITeam } from '@/models/Team';

interface CricbuzzScorecard {
  scoreCard?: Array<{
    matchId?: number;
    inningsId?: number;
    batTeamDetails?: {
      batTeamId?: number;
      batTeamName?: string;
      batTeamShortName?: string;
      batsmenData?: Record<string, {
        batId?: number;
        batName?: string;
        batShortName?: string;
        isCaptain?: boolean;
        isKeeper?: boolean;
        runs?: number;
        balls?: number;
        dots?: number;
        fours?: number;
        sixes?: number;
        mins?: number;
        strikeRate?: number;
        outDesc?: string;
        bowlerId?: number;
        fielderId1?: number;
        fielderId2?: number;
        fielderId3?: number;
        wicketCode?: string;
        isOverseas?: boolean;
        inMatchChange?: string;
        playingXIChange?: string;
      }>;
    };
    bowlTeamDetails?: {
      bowlTeamId?: number;
      bowlTeamName?: string;
      bowlTeamShortName?: string;
      bowlersData?: Record<string, {
        bowlerId?: number;
        bowlName?: string;
        bowlShortName?: string;
        overs?: string | number;
        maidens?: number;
        runs?: number;
        wickets?: number;
        economy?: number;
        dots?: number;
        foursConceded?: number;
        sixesConceded?: number;
        wide?: number;
        noBall?: number;
        isCaptain?: boolean;
        isKeeper?: boolean;
      }>;
    };
  }>;
}

interface OverByOverData {
  overs: number;
  bowlIds: number[];
  bowlNames: string[];
  ovrSummary: string;
}

interface OverByOverResponse {
  paginatedData: OverByOverData[];
  nextPaginationURL: string;
}

const CRICBUZZ_BASE_URL = 'https://www.cricbuzz.com';

function parseOvers(overs: string | number): number {
  if (typeof overs === 'number') return overs;
  if (!overs) return 0;

  const parts = String(overs).split('.');
  if (parts.length === 2) {
    return parseInt(parts[0]) + parseInt(parts[1]) / 6;
  }
  return parseFloat(overs) || 0;
}

function safeNum(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

function calculateBattingPoints(
  runs: number,
  balls: number,
  fours: number,
  sixes: number,
  strikeRate: number,
  wicketCode: string,
  outDesc: string
): number {
  let points = 0;

  // Run points: +1 per run
  points += runs;

  // Boundary Bonus: +4 per four
  points += fours * 4;

  // Six Bonus: +6 per six
  points += sixes * 6;

  // Century overrides all lower milestones
  if (runs >= 100) {
    points += 16; // Century Bonus
  } else if (runs >= 75) {
    // 75+ runs = 75 run bonus + half-century bonus (no century)
    points += 12; // 75 Run Bonus
    points += 8;  // Half-Century Bonus (75 includes 50)
  } else if (runs >= 50) {
    points += 8; // Half-Century Bonus
  } else if (runs >= 25) {
    points += 4; // 25 Run Bonus
  }

  // Dismissal for a duck: -2 (only if player got out, not "not out")
  // wicketCode is empty or "not out" means not dismissed
  const isOut = wicketCode && wicketCode.toLowerCase() !== '' &&
                outDesc && !outDesc.toLowerCase().includes('not out');

  if (runs === 0 && balls > 0 && isOut) {
    points -= 2;
  }

  // Strike Rate Points (min 10 balls)
  if (balls >= 10) {
    if (strikeRate > 170) {
      points += 6;
    } else if (strikeRate > 150) { // 150.01-170
      points += 4;
    } else if (strikeRate >= 130) { // 130-150
      points += 2;
    } else if (strikeRate <= 70 && strikeRate > 60) { // 60-70
      points -= 2;
    } else if (strikeRate <= 60 && strikeRate > 50) { // 50.01-59.99
      points -= 4;
    } else if (strikeRate <= 50) { // Below 50
      points -= 6;
    }
  }

  return points;
}

function calculateBowlingPoints(
  wickets: number,
  overs: number,
  economy: number,
  dots: number,
  maidens: number,
  wicketCode: string
): number {
  let points = 0;

  // Dot Ball: +1 per dot
  points += dots;

  // Wicket (Excluding Run Out): +30 per wicket
  points += wickets * 30;

  // Bonus (LBW/Bowled): +8 per dismissal
  // Check if dismissal was LBW or Bowled
  if (wicketCode === 'LBW' || wicketCode === 'BOWLED') {
    points += wickets * 8;
  }

  // Wicket Haul Bonuses
  if (wickets >= 5) {
    points += 12; // 5 Wicket Bonus
  } else if (wickets >= 4) {
    points += 8;  // 4 Wicket Bonus
  } else if (wickets >= 3) {
    points += 4;  // 3 Wicket Bonus
  }

  // Maiden Over: +12 per maiden
  points += maidens * 12;

  // Economy Rate Points (Min 2 Overs)
  if (overs >= 2) {
    if (economy < 5) {
      points += 6;
    } else if (economy < 6) { // 5-5.99
      points += 4;
    } else if (economy <= 7) { // 6-7
      points += 2;
    } else if (economy >= 10 && economy <= 11) { // 10-11
      points -= 2;
    } else if (economy > 11 && economy <= 12) { // 11.01-12
      points -= 4;
    } else if (economy > 12) { // Above 12
      points -= 6;
    }
  }

  return points;
}

function calculateFieldingPoints(
  catches: number,
  stumpings: number,
  runOutsDirect: number,
  runOutsIndirect: number
): number {
  let points = 0;

  // Catch: +8 per catch
  points += catches * 8;

  // 3 Catch Bonus: +4 (at 3+ catches total, not per catch)
  if (catches >= 3) {
    points += 4;
  }

  // Stumping: +12 per stumping
  points += stumpings * 12;

  // Run out (Direct hit): +12
  points += runOutsDirect * 12;

  // Run out (Not a direct hit): +6
  points += runOutsIndirect * 6;

  return points;
}

function countDotBalls(summary: string): number {
  let count = 0;
  const balls = summary.trim().split(/\s+/);

  for (const ball of balls) {
    if (ball === '0'|| ball.startsWith("L")) count++;
  }

  return count;
}

async function fetchInningsOverData(matchCricbuzzId: string, innings: number): Promise<OverByOverData[]> {
  let url = `${CRICBUZZ_BASE_URL}/api/mcenter/over-by-over/${matchCricbuzzId}/${innings}`;
  const allOvers: OverByOverData[] = [];
  const seenOvers = new Set<string>();

  while (url) {
    const readPage = async (): Promise<OverByOverResponse | null> => {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed API: ${url} (${res.status})`);
      }

      const raw = await res.text();
      if (!raw || !raw.trim()) {
        return null;
      }

      return JSON.parse(raw) as OverByOverResponse;
    };

    let data: OverByOverResponse | null = null;
    try {
      data = await readPage();
    } catch {
      // Retry once to handle intermittent truncated/empty responses.
      data = await readPage();
    }

    if (!data) {
      break;
    }

    for (const over of data.paginatedData || []) {
      const key = `${innings}-${over.overs}`;
      if (seenOvers.has(key)) continue;

      seenOvers.add(key);
      allOvers.push(over);
    }

    if (!data.nextPaginationURL) break;
    url = CRICBUZZ_BASE_URL + data.nextPaginationURL;
  }

  return allOvers;
}

async function getBowlerDotBalls(matchCricbuzzId: string): Promise<Record<number, number> | null> {
  try {
    const bowlerDotMap = new Map<number, number>();

    for (let innings = 1; innings <= 2; innings++) {
      const overs = await fetchInningsOverData(matchCricbuzzId, innings);

      for (const over of overs) {
        if (!over.bowlIds || over.bowlIds.length === 0) continue;

        const bowlerId = over.bowlIds[0];
        const dotBalls = countDotBalls(over.ovrSummary || '');

        bowlerDotMap.set(bowlerId, (bowlerDotMap.get(bowlerId) || 0) + dotBalls);
      }
    }

    const result: Record<number, number> = {};
    for (const [bowlerId, dots] of bowlerDotMap.entries()) {
      result[bowlerId] = dots;
    }

    return result;
  } catch (error) {
    console.error('Error fetching over-by-over dot balls:', error);
    return null;
  }
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

function getDefaultStats() {
  return {
    runs: 0,
    balls: 0,
    dots: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
    wickets: 0,
    overs: 0,
    maiden: 0,
    economy: 0,
    catches: 0,
    runOuts: 0,
    stumpings: 0,
    lbwBowled: 0,
    playingXI: 0,
    substitute: 0,
  };
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

    // Use over-by-over dots as source of truth when cricbuzzId is available.
    const correctedDotBalls = match.cricbuzzId
      ? await getBowlerDotBalls(String(match.cricbuzzId))
      : null;
    const correctedDotsApplied: Map<string, number> = new Map();

    const scorecardData = await fetchScorecard(scorecardUrl);
    if (!scorecardData || !scorecardData.scoreCard) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch scorecard data' },
        { status: 500 }
      );
    }

    // Map to store player points: externalId -> { points, stats }
    const playerPointsMap: Map<string, { points: number; stats: ReturnType<typeof getDefaultStats> }> = new Map();

    // Map to store fielding contributions: fielderId -> { catches, stumpings, runOutsDirect, runOutsIndirect }
    interface FieldingContribution {
      catches: number;
      stumpings: number;
      runOutsDirect: number;
      runOutsIndirect: number;
    }
    const fieldingMap: Map<string, FieldingContribution> = new Map();

    // Track LBW/Bowled dismissals by bowler for +8 bowling bonus.
    const lbwBowledByBowler: Map<string, number> = new Map();

    // Track players who appeared in playing XI (not substitutes)
    const playingXISet: Set<string> = new Set();

    // First pass: process all innings
    for (const innings of scorecardData.scoreCard || []) {
      const batsmenData = innings.batTeamDetails?.batsmenData || {};
      const bowlersData = innings.bowlTeamDetails?.bowlersData || {};

      // Process batsmen
      for (const [, batsman] of Object.entries(batsmenData)) {
        if (!batsman.batId) continue;

        const externalId = String(batsman.batId);
        const runs = batsman.runs || 0;
        const balls = batsman.balls || 0;
        const fours = batsman.fours || 0;
        const sixes = batsman.sixes || 0;
        const strikeRate = batsman.strikeRate || 0;
        const wicketCode = batsman.wicketCode || '';
        const outDesc = batsman.outDesc || '';
        const inMatchChange = batsman.inMatchChange || '';
        const playingXIChange = batsman.playingXIChange || '';

        if ((wicketCode === 'LBW' || wicketCode === 'BOWLED') && batsman.bowlerId) {
          const bowlerExternalId = String(batsman.bowlerId);
          lbwBowledByBowler.set(
            bowlerExternalId,
            (lbwBowledByBowler.get(bowlerExternalId) || 0) + 1
          );
        }

        // Calculate batting points
        const battingPoints = calculateBattingPoints(
          runs,
          balls,
          fours,
          sixes,
          strikeRate,
          wicketCode,
          outDesc
        );

        // Initialize or update player stats
        const existing = playerPointsMap.get(externalId) || {
          points: 0,
          stats: getDefaultStats(),
        };

        existing.stats.runs += runs;
        existing.stats.balls += balls;
        existing.stats.fours += fours;
        existing.stats.sixes += sixes;
        existing.stats.strikeRate = runs && balls ? (runs / balls) * 100 : 0;
        existing.points += battingPoints;

        // Track playing XI status
        // Any player who participated should receive Playing XI +4.
        if (balls > 0 || runs > 0 || !!playingXIChange || !!inMatchChange) {
          existing.stats.playingXI = 1;
          playingXISet.add(externalId);
        }

        // Track fielding contributions
        const wicketCodeUpper = wicketCode?.toUpperCase() || '';
        const isRunOut = wicketCodeUpper.includes('RUNOUT') || wicketCodeUpper === 'RUN OUT';
        const isCatch = wicketCodeUpper.includes('CAUGHT') || wicketCodeUpper.includes('C ');

        if (isRunOut) {
          // For run-outs: Both fielderId1 and fielderId2 are involved
          // Check if it's a direct hit (only one fielder involved)
          const isDirectHit = !batsman.fielderId2 || batsman.fielderId2 === 0;

          if (batsman.fielderId1) {
            const fielderId = String(batsman.fielderId1);
            if (!fieldingMap.has(fielderId)) {
              fieldingMap.set(fielderId, { catches: 0, stumpings: 0, runOutsDirect: 0, runOutsIndirect: 0 });
            }
            if (isDirectHit) {
              fieldingMap.get(fielderId)!.runOutsDirect += 1;
            } else {
              fieldingMap.get(fielderId)!.runOutsIndirect += 1;
            }
          }

          if (batsman.fielderId2) {
            const fielderId = String(batsman.fielderId2);
            if (!fieldingMap.has(fielderId)) {
              fieldingMap.set(fielderId, { catches: 0, stumpings: 0, runOutsDirect: 0, runOutsIndirect: 0 });
            }
            // fielderId2 is always involved in run-outs when present
            // If fielderId3 exists, it's not a direct hit
            const isStillDirectHit = isDirectHit && !batsman.fielderId3;
            if (isStillDirectHit) {
              fieldingMap.get(fielderId)!.runOutsDirect += 1;
            } else {
              fieldingMap.get(fielderId)!.runOutsIndirect += 1;
            }
          }
        } else if (isCatch) {
          // For catches: fielderId1 is the catcher
          if (batsman.fielderId1) {
            const fielderId = String(batsman.fielderId1);
            if (!fieldingMap.has(fielderId)) {
              fieldingMap.set(fielderId, { catches: 0, stumpings: 0, runOutsDirect: 0, runOutsIndirect: 0 });
            }
            fieldingMap.get(fielderId)!.catches += 1;
          }
        } else if (batsman.fielderId1 && !isRunOut) {
          // For other dismissals like stumping, fielderId1 might be involved
          const fielderId = String(batsman.fielderId1);
          if (!fieldingMap.has(fielderId)) {
            fieldingMap.set(fielderId, { catches: 0, stumpings: 0, runOutsDirect: 0, runOutsIndirect: 0 });
          }
          // Check if it's a stumping (wicket-keeper)
          if (wicketCodeUpper.includes('STUMPED') || wicketCodeUpper === 'STUMPING') {
            fieldingMap.get(fielderId)!.stumpings += 1;
          } else {
            fieldingMap.get(fielderId)!.catches += 1;
          }
        }

        playerPointsMap.set(externalId, existing);
      }

      // Process bowlers
      for (const [, bowler] of Object.entries(bowlersData)) {
        if (!bowler.bowlerId) continue;

        const externalId = String(bowler.bowlerId);
        const overs = parseOvers(bowler.overs || '0');
        const wickets = safeNum(bowler.wickets);
        const economy = safeNum(bowler.economy);
        const maidens = safeNum(bowler.maidens);
        const scorecardDots = safeNum(bowler.dots);
        let dots = scorecardDots;
        const correctedTotalDots = correctedDotBalls?.[Number(externalId)];
        if (typeof correctedTotalDots === 'number') {
          const alreadyApplied = correctedDotsApplied.get(externalId) || 0;
          dots = Math.max(0, correctedTotalDots - alreadyApplied);
          correctedDotsApplied.set(externalId, alreadyApplied + dots);
        }
        // Count wicket deliveries as dot balls as requested.
        dots += wickets;
        const runs = safeNum(bowler.runs);

        // Determine wicket type for bonus (assume regular wickets, not run outs)
        // In the API, we need to track if bowler got LBW/Bowled
        // For now, we'll check the batsman's wicketCode against bowler's deliveries
        // This is simplified - in reality you'd need more data

        // Calculate bowling points
        const bowlingPoints = calculateBowlingPoints(
          wickets,
          overs,
          economy,
          dots,
          maidens,
          '' // wicketCode - would need more data from API
        );

        // Initialize or update player stats
        const existing = playerPointsMap.get(externalId) || {
          points: 0,
          stats: getDefaultStats(),
        };

        existing.stats.wickets += wickets;
        existing.stats.overs += overs;
        existing.stats.maiden += maidens;
        existing.stats.dots += dots;
        existing.stats.economy = economy > 0 ? economy : overs > 0 ? runs / overs : 0;
        existing.points += bowlingPoints;

        const lbwBowledCount = lbwBowledByBowler.get(externalId) || 0;
        if (lbwBowledCount > 0) {
          existing.stats.lbwBowled += lbwBowledCount;
          existing.points += lbwBowledCount * 8;
          lbwBowledByBowler.set(externalId, 0);
        }

        // Check if bowler is in playing XI (bowlers who bowled are in playing XI)
        existing.stats.playingXI = 1;
        playingXISet.add(externalId);

        playerPointsMap.set(externalId, existing);
      }
    }

    // Apply fielding points
    const fieldingEntries = Array.from(fieldingMap.entries());
    for (const [fielderId, fielding] of fieldingEntries) {
      const existing = playerPointsMap.get(fielderId);
      if (existing) {
        existing.stats.catches = fielding.catches;
        existing.stats.runOuts = fielding.runOutsDirect + fielding.runOutsIndirect;

        const fieldingPoints = calculateFieldingPoints(
          fielding.catches,
          fielding.stumpings,
          fielding.runOutsDirect,
          fielding.runOutsIndirect
        );
        existing.points += fieldingPoints;
      }
    }

    // Add Playing XI bonus (+4)
    const playerEntries = Array.from(playerPointsMap.entries());
    for (const [externalId, playerData] of playerEntries) {
      if (playingXISet.has(externalId) || playerData.stats.playingXI === 1) {
        playerData.points += 4; // In announced lineups
      }
    }

    // Convert to array format for update
    const playerPointsArray = Array.from(playerPointsMap.entries()).map(([externalId, data]) => ({
      externalId,
      points: data.points,
      stats: data.stats,
    }));

    // Update player scores in database
    const updatedScores = await updatePlayerScore(matchId, playerPointsArray);

    // Calculate team scores with captain/vice-captain multipliers
    const updatedTeams = await calculateTeamScores(matchId);

    // Update match with last score update timestamp
    const now = new Date();
    await Match.findByIdAndUpdate(matchId, { lastScoreUpdate: now });

    // Get leaderboard
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
        lastScoreUpdate: now.toISOString(),
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
