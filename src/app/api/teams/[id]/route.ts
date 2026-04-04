import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/models/Team';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const team = await Team.findById(params.id).lean();
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      team: {
        ...team,
        _id: team._id.toString(),
        userId: team.userId?.toString(),
        contestId: team.contestId?.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team' },
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
    
    const data = await request.json();
    
    const team = await Team.findByIdAndUpdate(
      params.id,
      {
        $set: {
          name: data.name,
          players: data.players,
          totalCredits: data.totalCredits,
          captainId: data.captainId,
          viceCaptainId: data.viceCaptainId,
        },
      },
      { new: true }
    ).lean();
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      team: {
        ...team,
        _id: team._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const team = await Team.findByIdAndDelete(params.id);
    
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Team deleted',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}