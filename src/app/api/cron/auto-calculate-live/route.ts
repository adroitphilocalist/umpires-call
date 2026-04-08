import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match, IMatch } from '@/models/Match';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function getMatchStatus(matchDate: Date, dbStatus?: string): 'completed' | 'live' | 'upcoming' {
  const now = new Date();
  const rawMatchTime = new Date(matchDate);
  const normalizedMatchTime = new Date(rawMatchTime.getTime() - IST_OFFSET_MS);

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

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const authHeader = request.headers.get('authorization') || '';
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const allMatches = await Match.find({ scorecardUrl: { $exists: true, $ne: '' } })
      .sort({ date: -1 })
      .limit(50)
      .lean<IMatch[]>();

    const liveMatches = allMatches.filter((match) =>
      getMatchStatus(new Date(match.date), match.status) === 'live'
    );

    if (liveMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No live matches with scorecard URL found',
        processed: 0,
      });
    }

    const origin = new URL(request.url).origin;
    const results: Array<{ matchId: string; success: boolean; error?: string }> = [];

    for (const match of liveMatches) {
      try {
        const res = await fetch(`${origin}/api/scores/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: String(match._id),
            scorecardUrl: match.scorecardUrl,
          }),
          cache: 'no-store',
        });

        const data = await res.json();
        results.push({
          matchId: String(match._id),
          success: !!data.success,
          error: data.success ? undefined : (data.error || 'Calculation failed'),
        });
      } catch (error) {
        results.push({
          matchId: String(match._id),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      succeeded,
      failed: results.length - succeeded,
      results,
    });
  } catch (error) {
    console.error('Cron auto-calculate failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-calculate live match scores' },
      { status: 500 }
    );
  }
}
