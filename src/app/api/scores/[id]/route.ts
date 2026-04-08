import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Contest } from '@/models/Contest';
import { Team } from '@/models/Team';
import { User } from '@/models/User';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    

    const contest = await Contest.findById(params.id).lean() as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      description: string;
      matchId: mongoose.Types.ObjectId;
      entryFee: number;
      maxParticipants: number;
      prizePool: number;
      status: string;
      startTime: Date;
      endTime: Date;
      participants: Array<unknown>;
    };

    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }

    const teams = await Team.find({ contestId: params.id })
      .populate({ path: 'userId', model: User, select: 'displayName username avatar' })
      .sort({ score: -1 })
      .lean() as unknown as Array<{
        _id: mongoose.Types.ObjectId;
        name: string;
        score: number;
        userId: { _id: mongoose.Types.ObjectId; displayName: string; username: string; avatar: string } | null;
        players: Array<{ playerId: mongoose.Types.ObjectId; name: string; role: string; creditCost: number; image: string }>;
        captainId: mongoose.Types.ObjectId;
        viceCaptainId: mongoose.Types.ObjectId;
        totalCredits: number;
        createdAt: Date;
        updatedAt: Date;
      }>;

    const rankedTeams = teams.map((team, index) => ({
      _id: team._id.toString(),
      name: team.name,
      score: team.score,
      rank: index + 1,
      user: team.userId ? {
        _id: team.userId._id.toString(),
        displayName: team.userId.displayName,
        username: team.userId.username,
        avatar: team.userId.avatar,
      } : undefined,
      players: team.players.map((player) => ({
        playerId: player.playerId?.toString(),
        name: player.name,
        role: player.role,
        creditCost: player.creditCost,
        image: player.image,
      })),
      captainId: team.captainId.toString(),
      viceCaptainId: team.viceCaptainId.toString(),
      totalCredits: team.totalCredits,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      contest: {
        _id: contest._id.toString(),
        name: contest.name,
        description: contest.description,
        matchId: contest.matchId.toString(),
        entryFee: contest.entryFee,
        maxParticipants: contest.maxParticipants,
        prizePool: contest.prizePool,
        status: contest.status,
        startTime: contest.startTime,
        endTime: contest.endTime,
        participantCount: contest.participants?.length || 0,
      },
      teams: rankedTeams,
    });
  } catch (error) {
    console.error('Error fetching contest scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contest scores' },
      { status: 500 }
    );
  }
}
