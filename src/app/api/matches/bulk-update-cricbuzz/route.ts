import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

// Cricbuzz ID sequence based on user's pattern
// Starting from 149618, +11 for each match
// Pattern: 149618, 149629, 149640, 149651, 149662, 149673, 149684, 149695, 149699, 149710, 149721, 149732, 149743...
const CRICBUZZ_START_ID = 149618;
const CRICBUZZ_INCREMENT = 11;

// IDs to skip (gaps in the sequence)
const SKIP_IDS = [149696, 149697, 149698];

export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { startIndex = 0, count = 69, startCricbuzzId = CRICBUZZ_START_ID, skipGaps = true } = data;

    // Fetch all matches sorted by date
    const matches = await Match.find({})
      .sort({ date: 1 })
      .lean();

    if (matches.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No matches found',
      });
    }

    // Calculate starting Cricbuzz ID
    let nextCricbuzzId = startCricbuzzId;

    // If not starting from beginning, calculate the correct starting ID
    if (startIndex > 0 && skipGaps) {
      let calcId = CRICBUZZ_START_ID;
      for (let i = 0; i < startIndex; i++) {
        calcId += CRICBUZZ_INCREMENT;
        while (SKIP_IDS.includes(calcId)) {
          calcId += CRICBUZZ_INCREMENT;
        }
      }
      nextCricbuzzId = calcId;
    }

    const updates: any[] = [];
    const errors: any[] = [];

    // Update matches from startIndex
    for (let i = startIndex; i < Math.min(startIndex + count, matches.length); i++) {
      const match: any = matches[i];
      const cricbuzzId = nextCricbuzzId.toString();
      const scorecardUrl = `https://www.cricbuzz.com/api/mcenter/scorecard/${cricbuzzId}`;

      try {
        await Match.findByIdAndUpdate(match._id, {
          $set: {
            cricbuzzId: cricbuzzId,
            scorecardUrl: scorecardUrl,
          },
        });

        updates.push({
          matchId: match._id.toString(),
          matchName: `${match.team1.shortName} vs ${match.team2.shortName}`,
          date: match.date,
          cricbuzzId,
          scorecardUrl,
        });
      } catch (err: any) {
        errors.push({
          matchId: match._id.toString(),
          error: err.message,
        });
      }

      // Increment for next match
      nextCricbuzzId += CRICBUZZ_INCREMENT;
      // Skip the gap IDs (only if skipGaps is true)
      if (skipGaps) {
        while (SKIP_IDS.includes(nextCricbuzzId)) {
          nextCricbuzzId += CRICBUZZ_INCREMENT;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} matches`,
      updates,
      errors: errors.length > 0 ? errors : undefined,
      nextStartIndex: startIndex + updates.length,
      nextCricbuzzId: nextCricbuzzId,
    });
  } catch (error) {
    console.error('Error bulk updating matches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk update matches' },
      { status: 500 }
    );
  }
}

// GET: Just show what would be updated without making changes
export async function GET(request: Request) {
  try {
    await dbConnect();

    const matches = await Match.find({})
      .sort({ date: 1 })
      .lean();

    if (matches.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No matches found',
      });
    }

    let nextCricbuzzId = CRICBUZZ_START_ID;
    const preview: any[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match: any = matches[i];
      const cricbuzzId = nextCricbuzzId.toString();
      const scorecardUrl = `https://www.cricbuzz.com/api/mcenter/scorecard/${cricbuzzId}`;

      preview.push({
        index: i,
        matchId: match._id.toString(),
        matchName: `${match.team1.shortName} vs ${match.team2.shortName}`,
        date: new Date(match.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        currentCricbuzzId: match.cricbuzzId || 'not set',
        newCricbuzzId: cricbuzzId,
        scorecardUrl,
        needsUpdate: match.cricbuzzId !== cricbuzzId,
      });

      nextCricbuzzId += CRICBUZZ_INCREMENT;
      while (SKIP_IDS.includes(nextCricbuzzId)) {
        nextCricbuzzId += CRICBUZZ_INCREMENT;
      }
    }

    return NextResponse.json({
      success: true,
      totalMatches: matches.length,
      startId: CRICBUZZ_START_ID,
      increment: CRICBUZZ_INCREMENT,
      skipIds: SKIP_IDS,
      preview,
    });
  } catch (error) {
    console.error('Error previewing bulk update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to preview bulk update' },
      { status: 500 }
    );
  }
}
