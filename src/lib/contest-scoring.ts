import { MatchScoreStats, PlayerBreakdown } from '@/components/contest/types';

const toNum = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const getNormalizedMatchTime = (date: Date) => new Date(date);

export const getCountdownParts = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

export const buildDetailedBreakdown = (stats?: MatchScoreStats, totalPoints?: number): PlayerBreakdown[] => {
  if (!stats) {
    return [{ category: 'Other', description: 'Base fantasy points', points: toNum(totalPoints) }];
  }

  const runs = toNum(stats.runs);
  const balls = toNum(stats.balls);
  const dots = toNum(stats.dots);
  const fours = toNum(stats.fours);
  const sixes = toNum(stats.sixes);
  const strikeRate = toNum(stats.strikeRate);
  const wickets = toNum(stats.wickets);
  const overs = toNum(stats.overs);
  const maidens = toNum(stats.maiden);
  const economy = toNum(stats.economy);
  const catches = toNum(stats.catches);
  const runOuts = toNum(stats.runOuts);
  const stumpings = toNum(stats.stumpings);
  const lbwBowled = toNum(stats.lbwBowled);
  const playingXI = toNum(stats.playingXI);
  const hasBowlingContribution = overs > 0 || wickets > 0 || maidens > 0 || economy > 0;

  const breakdown: PlayerBreakdown[] = [];
  let computed = 0;

  if (runs > 0) {
    breakdown.push({ category: 'Batting', description: `${runs} runs (+1 each)`, points: runs });
    computed += runs;
  }
  if (fours > 0) {
    const pts = fours * 4;
    breakdown.push({ category: 'Batting', description: `${fours} fours (+4 each)`, points: pts });
    computed += pts;
  }
  if (sixes > 0) {
    const pts = sixes * 6;
    breakdown.push({ category: 'Batting', description: `${sixes} sixes (+6 each)`, points: pts });
    computed += pts;
  }

  if (runs >= 100) {
    breakdown.push({ category: 'Milestone', description: 'Century Bonus', points: 16 });
    computed += 16;
  } else if (runs >= 75) {
    breakdown.push({ category: 'Milestone', description: '75+ Runs Bonus', points: 12 });
    breakdown.push({ category: 'Milestone', description: 'Half-Century Bonus', points: 8 });
    computed += 20;
  } else if (runs >= 50) {
    breakdown.push({ category: 'Milestone', description: 'Half-Century Bonus', points: 8 });
    computed += 8;
  } else if (runs >= 25) {
    breakdown.push({ category: 'Milestone', description: '25+ Runs Bonus', points: 4 });
    computed += 4;
  }

  if (balls >= 10) {
    if (strikeRate > 170) {
      breakdown.push({ category: 'Strike Rate', description: 'SR > 170 (bonus)', points: 6 });
      computed += 6;
    } else if (strikeRate > 150) {
      breakdown.push({ category: 'Strike Rate', description: 'SR 150.01-170 (bonus)', points: 4 });
      computed += 4;
    } else if (strikeRate >= 130) {
      breakdown.push({ category: 'Strike Rate', description: 'SR 130-150 (bonus)', points: 2 });
      computed += 2;
    } else if (strikeRate <= 70 && strikeRate > 60) {
      breakdown.push({ category: 'Strike Rate', description: 'SR 60-70 (penalty)', points: -2 });
      computed -= 2;
    } else if (strikeRate <= 60 && strikeRate > 50) {
      breakdown.push({ category: 'Strike Rate', description: 'SR 50.01-60 (penalty)', points: -4 });
      computed -= 4;
    } else if (strikeRate <= 50) {
      breakdown.push({ category: 'Strike Rate', description: 'SR <50 (penalty)', points: -6 });
      computed -= 6;
    }
  }

  if (hasBowlingContribution && dots > 0) {
    breakdown.push({ category: 'Bowling', description: `${dots} dot balls (+1 each)`, points: dots });
    computed += dots;
  }
  if (wickets > 0) {
    const pts = wickets * 30;
    breakdown.push({ category: 'Bowling', description: `${wickets} wickets (+30 each)`, points: pts });
    computed += pts;
  }
  if (hasBowlingContribution && lbwBowled > 0) {
    const pts = lbwBowled * 8;
    breakdown.push({ category: 'Bowling', description: `${lbwBowled} LBW/Bowled (+8 each)`, points: pts });
    computed += pts;
  }
  if (wickets >= 5) {
    breakdown.push({ category: 'Bowling', description: '5 Wicket Haul Bonus', points: 12 });
    computed += 12;
  } else if (wickets >= 4) {
    breakdown.push({ category: 'Bowling', description: '4 Wicket Bonus', points: 8 });
    computed += 8;
  } else if (wickets >= 3) {
    breakdown.push({ category: 'Bowling', description: '3 Wicket Bonus', points: 4 });
    computed += 4;
  }
  if (maidens > 0) {
    const pts = maidens * 12;
    breakdown.push({ category: 'Bowling', description: `${maidens} maiden over(s) (+12 each)`, points: pts });
    computed += pts;
  }

  if (overs >= 2) {
    if (economy < 5) {
      breakdown.push({ category: 'Economy', description: 'Economy <5 (bonus)', points: 6 });
      computed += 6;
    } else if (economy < 6) {
      breakdown.push({ category: 'Economy', description: 'Economy 5-5.99 (bonus)', points: 4 });
      computed += 4;
    } else if (economy <= 7) {
      breakdown.push({ category: 'Economy', description: 'Economy 6-7 (bonus)', points: 2 });
      computed += 2;
    } else if (economy >= 10 && economy <= 11) {
      breakdown.push({ category: 'Economy', description: 'Economy 10-11 (penalty)', points: -2 });
      computed -= 2;
    } else if (economy > 11 && economy <= 12) {
      breakdown.push({ category: 'Economy', description: 'Economy 11.01-12 (penalty)', points: -4 });
      computed -= 4;
    } else if (economy > 12) {
      breakdown.push({ category: 'Economy', description: 'Economy >12 (penalty)', points: -6 });
      computed -= 6;
    }
  }

  if (catches > 0) {
    const pts = catches * 8;
    breakdown.push({ category: 'Fielding', description: `${catches} catch(es) (+8 each)`, points: pts });
    computed += pts;
    if (catches >= 3) {
      breakdown.push({ category: 'Fielding', description: '3+ Catches Bonus', points: 4 });
      computed += 4;
    }
  }
  if (stumpings > 0) {
    const pts = stumpings * 12;
    breakdown.push({ category: 'Fielding', description: `${stumpings} stumping(s) (+12 each)`, points: pts });
    computed += pts;
  }
  if (runOuts > 0) {
    const pts = runOuts * 6;
    breakdown.push({ category: 'Fielding', description: `${runOuts} run-out(s)`, points: pts });
    computed += pts;
  }

  if (playingXI > 0) {
    breakdown.push({ category: 'Other', description: 'Playing XI', points: 4 });
    computed += 4;
  }

  const base = toNum(totalPoints);
  let diff = Math.round((base - computed) * 100) / 100;

  // If final residual includes duck penalty, show it explicitly instead of hiding it in adjustment.
  if (runs === 0 && balls > 0 && diff <= -2) {
    breakdown.push({ category: 'Batting', description: 'Duck (dismissed for 0)', points: -2 });
    diff = Math.round((diff + 2) * 100) / 100;
  }

  if (diff !== 0) {
    breakdown.push({ category: 'Other', description: 'Scoring adjustment', points: diff });
  }

  if (breakdown.length === 0) {
    breakdown.push({ category: 'Other', description: 'Base fantasy points', points: base });
  }

  return breakdown;
};
