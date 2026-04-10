import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';
import { getMatchLifecycleStatus } from '@/lib/match-lock';

function isAuthorized(request: Request): boolean {
  const expectedToken = process.env.AUTO_CALC_SECRET;
  if (!expectedToken) {
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('secret') || '';
  return bearer === expectedToken || tokenFromQuery === expectedToken;
}

async function runAutoCalculate(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const matches = await Match.find({
      scorecardUrl: { $exists: true, $ne: '' },
    })
      .select('_id scorecardUrl date status')
      .lean<Array<{ _id: { toString: () => string }; scorecardUrl: string; date?: Date; status?: string }>>();

    const liveMatches = matches.filter((match) => {
      if (!match.date) return false;
      return getMatchLifecycleStatus(new Date(match.date), match.status) === 'live';
    });

    if (liveMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No live matches with scorecard URL',
        processed: 0,
        updated: 0,
        failed: 0,
        results: [],
      });
    }

    const origin = new URL(request.url).origin;

    const results = await Promise.all(
      liveMatches.map(async (match) => {
        try {
          const res = await fetch(`${origin}/api/scores/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            signal: AbortSignal.timeout(20000),
            body: JSON.stringify({
              matchId: match._id.toString(),
              scorecardUrl: match.scorecardUrl,
            }),
          });

          const data = await res.json();
          return {
            matchId: match._id.toString(),
            ok: !!data?.success,
            playersUpdated: data?.data?.playerScores?.length || 0,
            error: data?.success ? null : data?.error || 'Calculation failed',
          };
        } catch (error) {
          return {
            matchId: match._id.toString(),
            ok: false,
            playersUpdated: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const updated = results.filter((r) => r.ok).length;
    const failed = results.length - updated;

    return NextResponse.json({
      success: true,
      processed: results.length,
      updated,
      failed,
      results,
    });
  } catch (error) {
    console.error('Error in auto-calculate:', error);
    return NextResponse.json({ success: false, error: 'Failed to run auto-calculate' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return runAutoCalculate(request);
}

export async function GET(request: Request) {
  // Keep GET usable for simple browser checks and cron providers configured with GET.
  return runAutoCalculate(request);
}
