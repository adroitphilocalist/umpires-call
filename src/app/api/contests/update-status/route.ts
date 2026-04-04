import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Contest } from '@/models/Contest';
import { Match } from '@/models/Match';
import { getMatchStatus } from '@/lib/match-status';

interface UpdateSummary {
  totalChecked: number;
  updatedToCompleted: number;
  noChanges: number;
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const summary: UpdateSummary = {
      totalChecked: 0,
      updatedToCompleted: 0,
      noChanges: 0,
    };

    const contests = await Contest.find({}).lean();
    summary.totalChecked = contests.length;

    for (const contest of contests) {
      const contestWithType = contest as any;
      const matchId = contestWithType.matchId;

      if (!matchId) {
        continue;
      }

      const match = await Match.findById(matchId).lean();

      if (!match) {
        continue;
      }

      const matchDate = (match as any).date as Date;
      const matchStatus = getMatchStatus(matchDate);
      const currentContestStatus = contestWithType.status;

      if (matchStatus === 'completed' && currentContestStatus !== 'completed') {
        await Contest.findByIdAndUpdate(contestWithType._id, {
          status: 'completed',
        });
        summary.updatedToCompleted++;
      } else {
        summary.noChanges++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contest statuses updated successfully',
      summary,
    });
  } catch (error) {
    console.error('Error updating contest statuses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contest statuses' },
      { status: 500 }
    );
  }
}