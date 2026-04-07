import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { Contest } from '@/models/Contest';
import { Match } from '@/models/Match';
import { verifyToken } from '@/lib/jwt';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function getMatchStatus(matchDate: Date, dbStatus?: string): 'completed' | 'live' | 'upcoming' {
  if (dbStatus === 'completed') {
    return 'completed';
  }

  const now = new Date();
  const rawMatchTime = new Date(matchDate);
  const normalizedMatchTime = new Date(rawMatchTime.getTime() - IST_OFFSET_MS);

  if (now < normalizedMatchTime) {
    return 'upcoming';
  }

  const endTime = new Date(normalizedMatchTime.getTime() + FIVE_HOURS_MS);
  if (now < endTime) {
    return 'live';
  }

  return 'completed';
}

function getRequesterUserId(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('auth-token='));

  if (!tokenCookie) return null;

  const token = decodeURIComponent(tokenCookie.substring('auth-token='.length));
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contestId = searchParams.get('contestId');
    
    const query: any = {};
    if (userId) query.userId = userId;
    if (contestId) query.contestId = contestId;

    const requesterUserId = getRequesterUserId(request);
    let contestMatchStatus: 'completed' | 'live' | 'upcoming' | null = null;

    if (contestId) {
      const contest = await Contest.findById(contestId).lean() as any;
      if (contest?.matchId) {
        const match = await Match.findById(contest.matchId).lean() as any;
        if (match?.date) {
          contestMatchStatus = getMatchStatus(new Date(match.date), match.status);
        }
      }
    }
    
    const teams = await Team.find(query)
      .sort({ score: -1 })
      .lean() as unknown as Array<{
      _id: { toString(): string };
      userId: { toString(): string };
      contestId?: { toString(): string };
      name: string;
      score?: number;
      captainId: { toString(): string };
      viceCaptainId: { toString(): string };
      players: Array<{
        playerId: { toString(): string };
        name: string;
        role: string;
        creditCost: number;
      }>;
    }>;
    
    const teamsWithUser = await Promise.all(
      teams.map(async (t) => {
        const user = await User.findById(t.userId).lean() as unknown as {
          _id: { toString(): string };
          displayName: string;
        } | null;
        return {
          ...(function () {
            const ownerId = t.userId.toString();
            const isOwner = requesterUserId === ownerId;
            const shouldMaskPlayers = !userId && contestMatchStatus === 'upcoming' && !isOwner;

            return {
              ownerId,
              isTeamLocked: shouldMaskPlayers,
            };
          })(),
          ...t,
          _id: t._id.toString(),
          userId: t.userId.toString(),
          contestId: t.contestId?.toString(),
          captainId: t.captainId.toString(),
          viceCaptainId: t.viceCaptainId.toString(),
          players: (!userId && contestMatchStatus === 'upcoming' && requesterUserId !== t.userId.toString()) ? [] : t.players.map(p => ({
            playerId: p.playerId.toString(),
            name: p.name,
            role: p.role,
            creditCost: p.creditCost,
          })),
          playerCount: t.players.length,
          user: user ? {
            _id: user._id.toString(),
            displayName: user.displayName,
          } : null,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      teams: teamsWithUser,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    const existingTeam = await Team.findOne({
      userId: data.userId,
      contestId: data.contestId,
    });
    
    if (existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team already exists for this contest' },
        { status: 400 }
      );
    }
    
    const team = await Team.create({
      userId: data.userId,
      contestId: data.contestId,
      name: data.name,
      players: data.players,
      totalCredits: data.totalCredits,
      captainId: data.captainId,
      viceCaptainId: data.viceCaptainId,
      score: 0,
      rank: 0,
    });
    
    return NextResponse.json({
      success: true,
      team: {
        ...team.toObject(),
        _id: team._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
}