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

const CRICBUZZ_BASE_URL = 'https://www.cricbuzz.com';
const CACHE_TTL_MS = 2 * 60 * 1000;

const scorecardCache = new Map<string, { expiresAt: number; data: unknown }>();

function parseOvers(overs: string | number | undefined): number {
  if (typeof overs === 'number') return overs;
  if (!overs) return 0;

  const parts = String(overs).split('.');
  if (parts.length === 2) {
    return Number(parts[0]) + Number(parts[1]) / 6;
  }

  return Number(overs) || 0;
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

      const totalRuns = batsmen.reduce((sum, b) => sum + b.runs, 0);
      const wickets = batsmen.filter((b) => b.outDesc && !String(b.outDesc).toLowerCase().includes('not out') && b.outDesc !== 'Yet to bat').length;
      const maxOvers = bowlers.reduce((max, b) => Math.max(max, parseOvers(b.overs)), 0);
      const runRate = maxOvers > 0 ? Number((totalRuns / maxOvers).toFixed(2)) : 0;

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
        overs: Number(maxOvers.toFixed(1)),
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
