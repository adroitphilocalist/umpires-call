import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Player } from '@/models/Player';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const team = searchParams.get('team');
    
    const query: any = {};
    if (role) query.role = role;
    if (team) query.team = team;
    
    const players = await Player.find(query).lean();
    
    return NextResponse.json({
      success: true,
      players: players.map(p => ({
        ...p,
        _id: p._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    const players = await Player.insertMany(data.players);
    
    return NextResponse.json({
      success: true,
      players: players.map(p => ({
        ...p.toObject(),
        _id: p._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Error creating players:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create players' },
      { status: 500 }
    );
  }
}