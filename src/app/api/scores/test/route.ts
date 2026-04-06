import { NextResponse } from 'next/server';

// Dream11 T20 Fantasy Cricket Points System

interface CricbuzzBatsman {
  batId?: number;
  batName?: string;
  runs?: number;
  balls?: number;
  dots?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  wicketCode?: string;
  outDesc?: string;
  fielderId1?: number;
  fielderId2?: number;
  fielderId3?: number;
  inMatchChange?: string;
  playingXIChange?: string;
}

interface CricbuzzBowler {
  bowlerId?: number;
  bowlName?: string;
  overs?: string | number;
  maidens?: number;
  runs?: number;
  wickets?: number;
  economy?: number;
  dots?: number;
}

interface CricbuzzScorecard {
  scoreCard?: Array<{
    batTeamDetails?: {
      batsmenData?: Record<string, CricbuzzBatsman>;
    };
    bowlTeamDetails?: {
      bowlersData?: Record<string, CricbuzzBowler>;
    };
  }>;
}

interface PlayerPointsResult {
  playerId: number;
  playerName: string;
  points: number;
  breakdown: {
    category: string;
    description: string;
    points: number;
  }[];
  stats: {
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    strikeRate?: number;
    wickets?: number;
    overs?: number;
    economy?: number;
    maidens?: number;
    dots?: number;
    catches?: number;
    runOuts?: number;
    stumpings?: number;
  };
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
  strikeRate: number,
  wicketCode: string,
  outDesc: string
): { points: number; breakdown: PlayerPointsResult['breakdown'] } {
  const breakdown: PlayerPointsResult['breakdown'] = [];
  let points = 0;

  // Run points: +1 per run
  if (runs > 0) {
    points += runs;
    breakdown.push({ category: 'Batting', description: `+${runs} runs`, points: runs });
  }

  // Boundary Bonus: +4 per four
  if (fours > 0) {
    const boundaryPoints = fours * 4;
    points += boundaryPoints;
    breakdown.push({ category: 'Batting', description: `${fours} fours (+4 each)`, points: boundaryPoints });
  }

  // Six Bonus: +6 per six
  if (sixes > 0) {
    const sixPoints = sixes * 6;
    points += sixPoints;
    breakdown.push({ category: 'Batting', description: `${sixes} sixes (+6 each)`, points: sixPoints });
  }

  // Milestone bonuses (century overrides all lower milestones)
  if (runs >= 100) {
    points += 16;
    breakdown.push({ category: 'Milestone', description: 'Century Bonus', points: 16 });
  } else if (runs >= 75) {
    points += 12;
    breakdown.push({ category: 'Milestone', description: '75+ Runs Bonus', points: 12 });
    points += 8;
    breakdown.push({ category: 'Milestone', description: 'Half-Century Bonus', points: 8 });
  } else if (runs >= 50) {
    points += 8;
    breakdown.push({ category: 'Milestone', description: 'Half-Century Bonus', points: 8 });
  } else if (runs >= 25) {
    points += 4;
    breakdown.push({ category: 'Milestone', description: '25+ Runs Bonus', points: 4 });
  }

  // Dismissal for a duck: -2 (only if player got out, not "not out")
  const isOut = wicketCode && wicketCode.toLowerCase() !== '' &&
                outDesc && !outDesc.toLowerCase().includes('not out');

  if (runs === 0 && balls > 0 && isOut) {
    points -= 2;
    breakdown.push({ category: 'Batting', description: 'Duck (dismissed)', points: -2 });
  }

  // Strike Rate Points (min 10 balls)
  if (balls >= 10) {
    if (strikeRate > 170) {
      points += 6;
      breakdown.push({ category: 'Strike Rate', description: 'SR > 170', points: 6 });
    } else if (strikeRate > 150) {
      points += 4;
      breakdown.push({ category: 'Strike Rate', description: 'SR 150.01-170', points: 4 });
    } else if (strikeRate >= 130) {
      points += 2;
      breakdown.push({ category: 'Strike Rate', description: 'SR 130-150', points: 2 });
    } else if (strikeRate <= 70 && strikeRate > 60) {
      points -= 2;
      breakdown.push({ category: 'Strike Rate', description: 'SR 60-70 (penalty)', points: -2 });
    } else if (strikeRate <= 60 && strikeRate > 50) {
      points -= 4;
      breakdown.push({ category: 'Strike Rate', description: 'SR 50.01-60 (penalty)', points: -4 });
    } else if (strikeRate <= 50) {
      points -= 6;
      breakdown.push({ category: 'Strike Rate', description: 'SR <50 (penalty)', points: -6 });
    }
  }

  return { points, breakdown };
}

function calculateBowlingPoints(
  wickets: number,
  overs: number,
  economy: number,
  dots: number,
  maidens: number,
  wicketsLBW: number,
  wicketsBowled: number
): { points: number; breakdown: PlayerPointsResult['breakdown'] } {
  const breakdown: PlayerPointsResult['breakdown'] = [];
  let points = 0;

  // Dot Ball: +1 per dot
  if (dots > 0) {
    const dotPoints = dots;
    points += dotPoints;
    breakdown.push({ category: 'Bowling', description: `${dots} dot balls (+1 each)`, points: dotPoints });
  }

  // Wicket (Excluding Run Out): +30 per wicket
  if (wickets > 0) {
    const wicketPoints = wickets * 30;
    points += wicketPoints;
    breakdown.push({ category: 'Bowling', description: `${wickets} wickets (+30 each)`, points: wicketPoints });
  }

  // Bonus (LBW/Bowled): +8 per dismissal
  const totalSpecialWickets = wicketsLBW + wicketsBowled;
  if (totalSpecialWickets > 0) {
    const lbwBowledPoints = totalSpecialWickets * 8;
    points += lbwBowledPoints;
    breakdown.push({ category: 'Bowling', description: `${totalSpecialWickets} LBW/Bowled (+8 each)`, points: lbwBowledPoints });
  }

  // Wicket Haul Bonuses
  if (wickets >= 5) {
    points += 12;
    breakdown.push({ category: 'Bowling', description: '5 Wicket Haul Bonus', points: 12 });
  } else if (wickets >= 4) {
    points += 8;
    breakdown.push({ category: 'Bowling', description: '4 Wicket Bonus', points: 8 });
  } else if (wickets >= 3) {
    points += 4;
    breakdown.push({ category: 'Bowling', description: '3 Wicket Bonus', points: 4 });
  }

  // Maiden Over: +12 per maiden
  if (maidens > 0) {
    const maidenPoints = maidens * 12;
    points += maidenPoints;
    breakdown.push({ category: 'Bowling', description: `${maidens} maiden over(s) (+12 each)`, points: maidenPoints });
  }

  // Economy Rate Points (Min 2 Overs)
  if (overs >= 2) {
    if (economy < 5) {
      points += 6;
      breakdown.push({ category: 'Economy', description: `Economy <5 (bonus)`, points: 6 });
    } else if (economy < 6) {
      points += 4;
      breakdown.push({ category: 'Economy', description: `Economy 5-5.99 (bonus)`, points: 4 });
    } else if (economy <= 7) {
      points += 2;
      breakdown.push({ category: 'Economy', description: `Economy 6-7 (bonus)`, points: 2 });
    } else if (economy >= 10 && economy <= 11) {
      points -= 2;
      breakdown.push({ category: 'Economy', description: `Economy 10-11 (penalty)`, points: -2 });
    } else if (economy > 11 && economy <= 12) {
      points -= 4;
      breakdown.push({ category: 'Economy', description: `Economy 11.01-12 (penalty)`, points: -4 });
    } else if (economy > 12) {
      points -= 6;
      breakdown.push({ category: 'Economy', description: `Economy >12 (penalty)`, points: -6 });
    }
  }

  return { points, breakdown };
}

function calculateFieldingPoints(
  catches: number,
  stumpings: number,
  runOutsDirect: number,
  runOutsIndirect: number
): { points: number; breakdown: PlayerPointsResult['breakdown'] } {
  const breakdown: PlayerPointsResult['breakdown'] = [];
  let points = 0;

  // Catch: +8 per catch
  if (catches > 0) {
    const catchPoints = catches * 8;
    points += catchPoints;
    breakdown.push({ category: 'Fielding', description: `${catches} catch(es) (+8 each)`, points: catchPoints });
  }

  // 3 Catch Bonus: +4 (at 3+ catches total)
  if (catches >= 3) {
    points += 4;
    breakdown.push({ category: 'Fielding', description: '3+ Catches Bonus', points: 4 });
  }

  // Stumping: +12 per stumping
  if (stumpings > 0) {
    const stumpPoints = stumpings * 12;
    points += stumpPoints;
    breakdown.push({ category: 'Fielding', description: `${stumpings} stumping(s) (+12 each)`, points: stumpPoints });
  }

  // Run out (Direct hit): +12
  if (runOutsDirect > 0) {
    const directPoints = runOutsDirect * 12;
    points += directPoints;
    breakdown.push({ category: 'Fielding', description: `${runOutsDirect} direct hit run-out(s) (+12 each)`, points: directPoints });
  }

  // Run out (Not a direct hit): +6
  if (runOutsIndirect > 0) {
    const indirectPoints = runOutsIndirect * 6;
    points += indirectPoints;
    breakdown.push({ category: 'Fielding', description: `${runOutsIndirect} indirect run-out(s) (+6 each)`, points: indirectPoints });
  }

  return { points, breakdown };
}

function calculateOtherPoints(
  isPlayingXI: boolean,
  isSubstitute: boolean
): { points: number; breakdown: PlayerPointsResult['breakdown'] } {
  const breakdown: PlayerPointsResult['breakdown'] = [];
  let points = 0;

  // In announced lineups: +4
  if (isPlayingXI) {
    points += 4;
    breakdown.push({ category: 'Other', description: 'Playing XI', points: 4 });
  }

  // Concussion/X-Factor/Impact Player: +4
  if (isSubstitute) {
    points += 4;
    breakdown.push({ category: 'Other', description: 'Substitute (Concussion/X-Factor/Impact)', points: 4 });
  }

  return { points, breakdown };
}

export async function POST(request: Request) {
  try {
    const data: CricbuzzScorecard = await request.json();

    if (!data.scoreCard || data.scoreCard.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid scorecard data. Expected scoreCard array.' },
        { status: 400 }
      );
    }

    // Map to store player points: playerId -> result
    const playerPointsMap: Map<number, PlayerPointsResult> = new Map();

    // Map to store fielding contributions
    interface FieldingContribution {
      catches: number;
      stumpings: number;
      runOutsDirect: number;
      runOutsIndirect: number;
    }
    const fieldingMap: Map<number, FieldingContribution> = new Map();

    // Track playing XI status
    const playingXISet: Set<number> = new Set();

    // Process all innings
    for (const innings of data.scoreCard) {
      const batsmenData = innings.batTeamDetails?.batsmenData || {};
      const bowlersData = innings.bowlTeamDetails?.bowlersData || {};

      // Process batsmen
      for (const [, batsman] of Object.entries(batsmenData)) {
        if (!batsman.batId) continue;

        const playerId = batsman.batId;
        const runs = batsman.runs || 0;
        const balls = batsman.balls || 0;
        const fours = batsman.fours || 0;
        const sixes = batsman.sixes || 0;
        const dots = batsman.dots || 0;
        const strikeRate = batsman.strikeRate || 0;
        const wicketCode = batsman.wicketCode || '';
        const outDesc = batsman.outDesc || '';
        const inMatchChange = batsman.inMatchChange || '';
        const playingXIChange = batsman.playingXIChange || '';

        // Calculate batting points
        const { points: battingPoints, breakdown: battingBreakdown } = calculateBattingPoints(
          runs, balls, fours, sixes, strikeRate, wicketCode, outDesc
        );

        // Check if LBW or Bowled
        const isLBW = wicketCode === 'LBW';
        const isBowled = wicketCode === 'BOWLED';

        // Initialize or update player
        const existing = playerPointsMap.get(playerId) || {
          playerId,
          playerName: batsman.batName || 'Unknown',
          points: 0,
          breakdown: [],
          stats: {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            wickets: 0,
            overs: 0,
            economy: 0,
            maidens: 0,
            dots: 0,
            catches: 0,
            runOuts: 0,
            stumpings: 0,
          },
        };

        existing!.points += battingPoints;
        existing!.breakdown.push(...battingBreakdown);
        existing!.stats.runs = (existing!.stats.runs ?? 0) + runs;
        existing!.stats.balls = (existing!.stats.balls ?? 0) + balls;
        existing!.stats.fours = (existing!.stats.fours ?? 0) + fours;
        existing!.stats.sixes = (existing!.stats.sixes ?? 0) + sixes;
        existing!.stats.strikeRate = runs && balls ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0;

        // Track playing XI status
        const isSubstitute = playingXIChange === 'IN' || inMatchChange.includes('MOUT');
        if (!isSubstitute && balls > 0) {
          existing!.points += 4; // Playing XI bonus
          existing!.breakdown.push({ category: 'Other', description: 'Playing XI', points: 4 });
          playingXISet.add(playerId);
        }
        if (isSubstitute) {
          existing!.points += 4; // Substitute bonus
          existing!.breakdown.push({ category: 'Other', description: 'Substitute', points: 4 });
        }

        // Track fielding (catches)
        if (batsman.fielderId1) {
          const fielderId = batsman.fielderId1;
          if (!fieldingMap.has(fielderId)) {
            fieldingMap.set(fielderId, { catches: 0, stumpings: 0, runOutsDirect: 0, runOutsIndirect: 0 });
          }
          // Check if this is a catch or a run-out
          const wCode = wicketCode?.toLowerCase() || '';
          if (wCode.includes('caught') || wCode.includes('c ')) {
            fieldingMap.get(fielderId)!.catches += 1;
          }
        }

        // Track run-outs (fielderId2 and fielderId3)
        if (batsman.fielderId2) {
          const fielderId = batsman.fielderId2;
          if (!fieldingMap.has(fielderId)) {
            fieldingMap.set(fielderId, { catches: 0, stumpings: 0, runOutsDirect: 0, runOutsIndirect: 0 });
          }
          const isDirectHit = !batsman.fielderId3 || batsman.fielderId3 === 0;
          if (isDirectHit) {
            fieldingMap.get(fielderId)!.runOutsDirect += 1;
          } else {
            fieldingMap.get(fielderId)!.runOutsIndirect += 1;
          }
        }

        // If bowler got LBW/Bowled, we need to track it for bowler's bonus
        // For now, we'll track it in the batsman's entry (for reference)

        playerPointsMap.set(playerId, existing);
      }

      // Process bowlers
      for (const [, bowler] of Object.entries(bowlersData)) {
        if (!bowler.bowlerId) continue;

        const playerId = bowler.bowlerId;
        const overs = parseOvers(bowler.overs || '0');
        const wickets = bowler.wickets || 0;
        const economy = bowler.economy || 0;
        const maidens = bowler.maidens || 0;
        const dots = bowler.dots || 0;
        const runs = bowler.runs || 0;

        // Initialize or update player
        const existing = playerPointsMap.get(playerId) || {
          playerId,
          playerName: bowler.bowlName || 'Unknown',
          points: 0,
          breakdown: [],
          stats: {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            wickets: 0,
            overs: 0,
            economy: 0,
            maidens: 0,
            dots: 0,
            catches: 0,
            runOuts: 0,
            stumpings: 0,
          },
        };

        // Calculate bowling points (without LBW/Bowled info - would need more data)
        const { points: bowlingPoints, breakdown: bowlingBreakdown } = calculateBowlingPoints(
          wickets, overs, economy, dots, maidens, 0, 0 // LBW/Bowled need extra data
        );

        existing!.points += bowlingPoints;
        existing!.breakdown.push(...bowlingBreakdown);
        existing!.stats.wickets = (existing!.stats.wickets ?? 0) + wickets;
        existing!.stats.overs = (existing!.stats.overs ?? 0) + parseFloat(overs.toFixed(2));
        existing!.stats.maidens = (existing!.stats.maidens ?? 0) + maidens;
        existing!.stats.dots = (existing!.stats.dots ?? 0) + dots;
        existing!.stats.economy = economy > 0 ? economy : (runs / overs || 0);

        // Bowlers are in playing XI
        existing!.points += 4; // Playing XI bonus
        existing!.breakdown.push({ category: 'Other', description: 'Playing XI', points: 4 });
        playingXISet.add(playerId);

        playerPointsMap.set(playerId, existing);
      }
    }

    // Apply fielding points
    for (const [fielderId, fielding] of fieldingMap.entries()) {
      const existing = playerPointsMap.get(fielderId);
      if (existing) {
        existing!.stats.catches = fielding.catches;
        existing!.stats.runOuts = fielding.runOutsDirect + fielding.runOutsIndirect;
        existing!.stats.stumpings = fielding.stumpings;

        const { points: fieldingPoints, breakdown: fieldingBreakdown } = calculateFieldingPoints(
          fielding.catches,
          fielding.stumpings,
          fielding.runOutsDirect,
          fielding.runOutsIndirect
        );
        existing!.points += fieldingPoints;
        existing!.breakdown.push(...fieldingBreakdown);
      }
    }

    // Sort by points (descending)
    const sortedResults = Array.from(playerPointsMap.values())
      .sort((a, b) => b.points - a.points);

    // Calculate total points
    const totalPoints = sortedResults.reduce((sum, p) => sum + p.points, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalPlayers: sortedResults.length,
        totalPoints,
        players: sortedResults,
      },
    });
  } catch (error) {
    console.error('Error calculating test scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate test scores' },
      { status: 500 }
    );
  }
}
