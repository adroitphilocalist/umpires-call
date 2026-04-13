import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Match } from '@/models/Match';
import { Player } from '@/models/Player';
import { MatchLineup } from '@/models/MatchLineup';
import { parseLineupText, resolveParsedLineup } from '@/lib/match-lineup';

export async function POST(
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
    const rawText = String(body?.rawText || '').trim();
    if (!rawText) {
      return NextResponse.json({ success: false, error: 'rawText is required' }, { status: 400 });
    }

    const match = await Match.findById(matchId).lean<any>();
    if (!match) {
      return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    }

    const players = await Player.find({}).lean<any[]>();
    const parsed = parseLineupText(rawText);
    const resolved = resolveParsedLineup(parsed, players as any, {
      team1Name: match.team1?.name || '',
      team2Name: match.team2?.name || '',
    });

    const saved = await MatchLineup.findOneAndUpdate(
      { matchId: new mongoose.Types.ObjectId(matchId) },
      {
        $set: {
          matchId: new mongoose.Types.ObjectId(matchId),
          rawText,
          team1: resolved.team1,
          team2: resolved.team2,
          validation: resolved.validation,
          status: 'draft',
          parsedAt: new Date(),
          approvedAt: null,
          approvedBy: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<any>();

    return NextResponse.json({
      success: true,
      lineup: {
        ...saved,
        _id: String(saved._id),
        matchId: String(saved.matchId),
      },
    });
  } catch (error) {
    console.error('Error parsing lineup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse lineup text' },
      { status: 500 }
    );
  }
}
