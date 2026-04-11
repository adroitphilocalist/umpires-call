import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

interface RawOverData {
  overs: number;
  bowlIds: number[];
  bowlNames: string[];
  ovrSummary: string;
}

interface RawOverByOverResponse {
  paginatedData: RawOverData[];
  nextPaginationURL: string;
}

interface RawScorecard {
  scoreCard?: Array<{
    inningsId?: number;
    scoreDetails?: {
      runs?: number | string;
      wickets?: number | string;
      overs?: number | string;
      runRate?: number | string;
      rr?: number | string;
    };
    batTeamDetails?: {
      batTeamName?: string;
      batTeamShortName?: string;
      batsmenData?: Record<string, {
        batId?: number;
        batName?: string;
        runs?: number;
        balls?: number;
        fours?: number;
        sixes?: number;
        strikeRate?: number;
        outDesc?: string;
      }>;
    };
    bowlTeamDetails?: {
      bowlTeamName?: string;
      bowlTeamShortName?: string;
      bowlersData?: Record<string, {
        bowlerId?: number;
        bowlName?: string;
        overs?: string | number;
        maidens?: number;
        runs?: number;
        wickets?: number;
        economy?: number;
        dots?: number;
      }>;
    };
  }>;
}

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const CRICBUZZ_BASE_URL = 'https://www.cricbuzz.com';
const CACHE_TTL_MS = 2 * 60 * 1000;

const scorecardCache = new Map<string, { expiresAt: number; data: unknown }>();

function oversToBalls(overs: string | number | undefined): number {
  if (overs === undefined || overs === null) return 0;

  const value = String(overs).trim();
  if (!value) return 0;

  const [wholePart, ballPart] = value.split('.');
  const completeOvers = Number.parseInt(wholePart || '0', 10);
  const ballsInCurrentOver = Number.parseInt((ballPart || '0').slice(0, 1), 10);

  if (!Number.isFinite(completeOvers)) return 0;
  const safeBalls = Number.isFinite(ballsInCurrentOver) ? Math.min(Math.max(ballsInCurrentOver, 0), 5) : 0;
  return completeOvers * 6 + safeBalls;
}

function ballsToOversValue(totalBalls: number): number {
  const safeBalls = Math.max(0, Math.floor(totalBalls));
  const completeOvers = Math.floor(safeBalls / 6);
  const ballsInCurrentOver = safeBalls % 6;
  return Number(`${completeOvers}.${ballsInCurrentOver}`);
}

function countDotBalls(summary: string): number {
  const balls = (summary || '').trim().split(/\s+/);
  let dots = 0;
  for (const ball of balls) {
    if (ball === '0') dots += 1;
  }
  return dots;
}

async function fetchJsonWithRetry(url: string): Promise<unknown | null> {
  const readOnce = async (): Promise<unknown | null> => {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Fetch failed (${res.status}) for ${url}`);
    }

    const raw = await res.text();
    if (!raw || !raw.trim()) {
      return null;
    }

    return JSON.parse(raw);
  };

  try {
    return await readOnce();
  } catch {
    return await readOnce();
  }
}

async function fetchInningsOverData(matchCricbuzzId: string, innings: number): Promise<RawOverData[]> {
  let url = `${CRICBUZZ_BASE_URL}/api/mcenter/over-by-over/${matchCricbuzzId}/${innings}`;
  const allOvers: RawOverData[] = [];
  const seenOvers = new Set<string>();

  while (url) {
    const payload = await fetchJsonWithRetry(url);
    if (!payload) {
      break;
    }

    const data = payload as RawOverByOverResponse;

    for (const over of data.paginatedData || []) {
      const key = `${innings}-${over.overs}`;
      if (seenOvers.has(key)) continue;
      seenOvers.add(key);
      allOvers.push(over);
    }

    if (!data.nextPaginationURL) break;
    url = `${CRICBUZZ_BASE_URL}${data.nextPaginationURL}`;
  }

  return allOvers;
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ success: false, error: 'matchId is required' }, { status: 400 });
    }

    const cacheKey = `scorecard:${matchId}`;
    const cached = scorecardCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    const match = await Match.findById(matchId).select('team1 team2 status scorecardUrl cricbuzzId').lean() as {
      _id: { toString: () => string };
      team1?: { name?: string; shortName?: string };
      team2?: { name?: string; shortName?: string };
      status?: string;
      scorecardUrl?: string;
      cricbuzzId?: string;
    } | null;

    if (!match) {
      return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    }

    if (!match.scorecardUrl) {
      return NextResponse.json({ success: false, error: 'Scorecard URL is not configured for this match' }, { status: 400 });
    }

    const scorecardPayload = await fetchJsonWithRetry(match.scorecardUrl);
    if (!scorecardPayload) {
      return NextResponse.json({ success: false, error: 'Unable to fetch scorecard payload' }, { status: 502 });
    }

    const scorecardData = scorecardPayload as RawScorecard;
    const inningsCards = scorecardData.scoreCard || [];

    const overByOver: Array<{ innings: number; overs: RawOverData[] }> = [];
    if (match.cricbuzzId) {
      for (let innings = 1; innings <= 2; innings++) {
        const overs = await fetchInningsOverData(String(match.cricbuzzId), innings);
        overByOver.push({ innings, overs });
      }
    }

    const bowlerDots = new Map<number, number>();
    for (const inningsChunk of overByOver) {
      for (const over of inningsChunk.overs) {
        const bowlerId = over.bowlIds?.[0];
        if (!bowlerId) continue;
        const dotBalls = countDotBalls(over.ovrSummary || '');
        bowlerDots.set(bowlerId, (bowlerDots.get(bowlerId) || 0) + dotBalls);
      }
    }

    const transformedInnings = inningsCards.map((innings) => {
      const batsmen = Object.values(innings.batTeamDetails?.batsmenData || {}).map((b) => ({
        id: b.batId || 0,
        name: b.batName || 'Unknown',
        runs: b.runs || 0,
        balls: b.balls || 0,
        fours: b.fours || 0,
        sixes: b.sixes || 0,
        strikeRate: b.strikeRate || 0,
        outDesc: b.outDesc || 'Yet to bat',
      }));

      const bowlers = Object.values(innings.bowlTeamDetails?.bowlersData || {}).map((b) => ({
        id: b.bowlerId || 0,
        name: b.bowlName || 'Unknown',
        overs: b.overs || '0',
        maidens: b.maidens || 0,
        runs: b.runs || 0,
        wickets: b.wickets || 0,
        economy: b.economy || 0,
        scorecardDots: b.dots || 0,
        liveDots: b.bowlerId ? (bowlerDots.get(b.bowlerId) || 0) : 0,
      }));

      const computedRuns = batsmen.reduce((sum, b) => sum + b.runs, 0);

      const bowlerWickets = bowlers.reduce((sum, b) => sum + (b.wickets || 0), 0);
      const nonBowlerDismissals = batsmen.filter((b) => {
        const desc = String(b.outDesc || '').toLowerCase().trim();
        if (!desc || desc === 'yet to bat') return false;
        if (desc.includes('not out') || desc.includes('batting')) return false;
        if (desc.includes('retired hurt') || desc.includes('absent hurt')) return false;

        return (
          desc.includes('run out') ||
          desc.includes('retired out') ||
          desc.includes('obstructing the field') ||
          desc.includes('timed out') ||
          desc.includes('handled the ball')
        );
      }).length;

      const computedWickets = Math.min(10, bowlerWickets + nonBowlerDismissals);
      const totalBallsBowled = bowlers.reduce((sum, b) => sum + oversToBalls(b.overs), 0);
      const computedOvers = ballsToOversValue(totalBallsBowled);
      const computedRunRate = totalBallsBowled > 0 ? Number((computedRuns / (totalBallsBowled / 6)).toFixed(2)) : 0;

      const officialRuns = toFiniteNumber(innings.scoreDetails?.runs);
      const officialWickets = toFiniteNumber(innings.scoreDetails?.wickets);
      const officialOversRaw = toFiniteNumber(innings.scoreDetails?.overs);
      const officialRunRate = toFiniteNumber(innings.scoreDetails?.runRate ?? innings.scoreDetails?.rr);

      const totalRuns = officialRuns ?? computedRuns;
      const wickets = officialWickets !== null ? Math.min(10, Math.max(0, Math.floor(officialWickets))) : computedWickets;
      const inningsOvers = officialOversRaw !== null ? ballsToOversValue(oversToBalls(officialOversRaw)) : computedOvers;
      const runRate = officialRunRate ?? computedRunRate;

      const topScorer = [...batsmen].sort((a, b) => b.runs - a.runs)[0] || null;
      const bestBowler = [...bowlers].sort((a, b) => {
        if (b.wickets !== a.wickets) return b.wickets - a.wickets;
        return a.economy - b.economy;
      })[0] || null;

      return {
        inningsId: innings.inningsId || 0,
        battingTeamName: innings.batTeamDetails?.batTeamName || 'Batting Team',
        battingTeamShortName: innings.batTeamDetails?.batTeamShortName || '',
        bowlingTeamName: innings.bowlTeamDetails?.bowlTeamName || 'Bowling Team',
        bowlingTeamShortName: innings.bowlTeamDetails?.bowlTeamShortName || '',
        totalRuns,
        wickets,
        overs: inningsOvers,
        runRate,
        topScorer,
        bestBowler,
        batsmen,
        bowlers,
      };
    });

    const recentOvers = overByOver
      .flatMap((chunk) => chunk.overs.map((over) => ({
        innings: chunk.innings,
        over: over.overs,
        summary: over.ovrSummary,
        bowlerName: over.bowlNames?.[0] || 'Unknown',
      })))
      .sort((a, b) => {
        if (a.innings !== b.innings) return b.innings - a.innings;
        return b.over - a.over;
      })
      .slice(0, 18);

    const payload = {
      fetchedAt: new Date().toISOString(),
      match: {
        id: match._id.toString(),
        status: match.status || 'upcoming',
        team1: match.team1,
        team2: match.team2,
      },
      innings: transformedInnings,
      recentOvers,
    };

    scorecardCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: payload,
    });

    return NextResponse.json({ success: true, data: payload, cached: false });
  } catch (error) {
    console.error('Error fetching live scorecard:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch live scorecard' }, { status: 500 });
  }
}
