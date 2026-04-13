import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { MatchLineup } from '@/models/MatchLineup';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const matchId = params.id;
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json({ success: false, error: 'Invalid match id' }, { status: 400 });
    }

    const lineup = await MatchLineup.findOne({
      matchId: new mongoose.Types.ObjectId(matchId),
    }).lean<any>();

    if (!lineup) {
      return NextResponse.json({ success: true, lineup: null });
    }

    return NextResponse.json({
      success: true,
      lineup: {
        ...lineup,
        _id: String(lineup._id),
        matchId: String(lineup.matchId),
      },
    });
  } catch (error) {
    console.error('Error fetching lineup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lineup' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const matchId = params.id;
    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json({ success: false, error: 'Invalid match id' }, { status: 400 });
    }

    const body = await request.json();
    const status = body?.status === 'draft' ? 'draft' : 'approved';
    const approvedBy = typeof body?.approvedBy === 'string' ? body.approvedBy : undefined;

    const update: any = {
      status,
    };

    if (status === 'approved') {
      update.approvedAt = new Date();
      if (approvedBy) {
        update.approvedBy = approvedBy;
      }
    } else {
      update.approvedAt = null;
      update.approvedBy = null;
    }

    const lineup = await MatchLineup.findOneAndUpdate(
      { matchId: new mongoose.Types.ObjectId(matchId) },
      { $set: update },
      { new: true }
    ).lean<any>();

    if (!lineup) {
      return NextResponse.json(
        { success: false, error: 'No parsed lineup found for this match' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lineup: {
        ...lineup,
        _id: String(lineup._id),
        matchId: String(lineup.matchId),
      },
    });
  } catch (error) {
    console.error('Error updating lineup status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lineup status' },
      { status: 500 }
    );
  }
}
