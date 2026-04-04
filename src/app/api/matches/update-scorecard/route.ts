import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { matchId, scorecardUrl, cricbuzzId } = data;

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'matchId is required' },
        { status: 400 }
      );
    }

    const updateFields: { [key: string]: string } = {};
    if (scorecardUrl !== undefined) {
      updateFields.scorecardUrl = scorecardUrl;
    }
    if (cricbuzzId !== undefined) {
      updateFields.cricbuzzId = cricbuzzId;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const match = await Match.findByIdAndUpdate(
      matchId,
      { $set: updateFields },
      { new: true }
    );

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      match: {
        ...match.toObject(),
        _id: match._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating scorecard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scorecard' },
      { status: 500 }
    );
  }
}