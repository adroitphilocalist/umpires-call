import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { DailyLeaderboard } from '@/models/DailyLeaderboard';
import { User } from '@/models/User';

const LEADERBOARD_SLUG = 'global';
const EDITOR_PHONES = new Set(['+919163065575', '+916291299136']);
const NAME_EMAIL_OVERRIDES: Record<string, string> = {
  sayanta: 'sayantamondalrup@gmail.com',
};

const REQUIRED_ENTRIES = [
  {
    name: 'Souhardya',
    email: 'souhardyanandy47@gmail.com',
    mp: 1,
    gain: 0,
    winPct: 0,
  },
];

const INITIAL_ENTRIES = [
  {
    name: 'Barnik',
    email: 'barnikchakraborty24@gmail.com',
    mp: 14,
    gain: 205,
    winPct: 57.14,
  },
  {
    name: 'Soumya',
    email: 'dassoumyadipta007@gmail.com',
    mp: 12,
    gain: 135,
    winPct: 58.33,
  },
  {
    name: 'Piyush',
    email: 'sahapiyush5@gmail.com',
    mp: 16,
    gain: 145,
    winPct: 37.5,
  },
  {
    name: 'Deeptangshu',
    email: 'sendeeptangshu91@gmail.com',
    mp: 11,
    gain: 75,
    winPct: 27.27,
  },
  {
    name: 'Sayanta',
    email: 'sayantamondalrup@gmail.com',
    mp: 2,
    gain: 20,
    winPct: 50,
  },
  {
    name: 'Sirsha',
    email: 'shirsamaitra@gmail.com',
    mp: 3,
    gain: 0,
    winPct: 0,
  },
  {
    name: 'Souhardya',
    email: 'souhardyanandy47@gmail.com',
    mp: 1,
    gain: 0,
    winPct: 0,
  },
];

type RankedRow = {
  id: string;
  name: string;
  email: string;
  linkedUser: { id: string; displayName: string; email: string } | null;
  mp: number;
  given: number;
  gain: number;
  net: number;
  wins: number;
  winPct: number;
  rank: number;
};

function toFinite(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getRequesterPayload(request: Request): { userId: string; phone: string } | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('auth-token='));

  if (!tokenCookie) return null;

  const token = decodeURIComponent(tokenCookie.substring('auth-token='.length));
  const payload = verifyToken(token);
  if (!payload?.userId || !payload.phone) return null;
  return { userId: payload.userId, phone: payload.phone };
}

function buildRankedRows(
  entries: Array<{
    _id: { toString: () => string };
    name?: string;
    email?: string;
    userId?: { toString: () => string };
    mp?: number;
    gain?: number;
    winPct?: number;
  }>,
  userMap: Map<string, { id: string; displayName: string; email: string }>
): RankedRow[] {
  const hydrated = entries.map((entry) => {
    const mp = Math.max(0, Math.floor(toFinite(entry.mp, 0)));
    const given = mp * 10;
    const gain = toFinite(entry.gain, 0);
    const net = gain - given;
    const winPct = Math.max(0, Number(toFinite(entry.winPct, 0).toFixed(2)));
    const wins = Math.max(0, Math.round((mp * winPct) / 100));
    const userId = entry.userId?.toString() || '';

    return {
      id: entry._id.toString(),
      name: String(entry.name || 'Unknown'),
      email: String(entry.email || ''),
      linkedUser: userId ? userMap.get(userId) || null : null,
      mp,
      given,
      gain,
      net,
      wins,
      winPct,
      rank: 0,
    };
  });

  hydrated.sort((a, b) => {
    if (b.net !== a.net) {
      const netLeader = a.net > b.net ? a : b;
      const other = netLeader === a ? b : a;
      const mpGap = other.mp - netLeader.mp;

      // Special rule: higher net leads only when it does not come with an MP deficit greater than 4.
      if (mpGap > 4) {
        return netLeader === a ? 1 : -1;
      }

      return netLeader === a ? -1 : 1;
    }

    if (b.mp !== a.mp) return b.mp - a.mp;
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    return a.name.localeCompare(b.name);
  });

  return hydrated.map((row, idx) => ({ ...row, rank: idx + 1 }));
}

async function ensureSeededLeaderboard() {
  let board = await DailyLeaderboard.findOne({ slug: LEADERBOARD_SLUG });
  if (board) return board;

  const users = await User.find({
    email: { $in: INITIAL_ENTRIES.map((entry) => entry.email).filter(Boolean) },
  })
    .select('_id email')
    .lean<Array<{ _id: { toString: () => string }; email: string }>>();

  const byEmail = new Map<string, string>();
  users.forEach((u) => byEmail.set(String(u.email || '').toLowerCase(), u._id.toString()));

  board = await DailyLeaderboard.create({
    slug: LEADERBOARD_SLUG,
    entries: INITIAL_ENTRIES.map((entry) => ({
      ...entry,
      userId: entry.email ? byEmail.get(entry.email.toLowerCase()) : undefined,
    })),
  });

  return board;
}

async function syncUserLinks(board: any) {
  let changed = false;

  for (const requiredEntry of REQUIRED_ENTRIES) {
    const targetEmail = String(requiredEntry.email || '').trim().toLowerCase();
    const targetName = String(requiredEntry.name || '').trim().toLowerCase();

    const exists = (board.entries || []).some((entry: any) => {
      const existingEmail = String(entry.email || '').trim().toLowerCase();
      const existingName = String(entry.name || '').trim().toLowerCase();
      return (!!targetEmail && existingEmail === targetEmail) || (!!targetName && existingName === targetName);
    });

    if (!exists) {
      board.entries.push({ ...requiredEntry });
      changed = true;
    }
  }

  for (const entry of board.entries || []) {
    const normalizedName = String(entry.name || '').trim().toLowerCase();
    const overrideEmail = NAME_EMAIL_OVERRIDES[normalizedName];
    if (overrideEmail && String(entry.email || '').trim().toLowerCase() !== overrideEmail) {
      entry.email = overrideEmail;
      changed = true;
    }
  }

  const unresolved = (board.entries || []).filter((entry: any) => !entry.userId && entry.email);
  if (unresolved.length > 0) {
    const emails = unresolved.map((entry: any) => String(entry.email).toLowerCase());
    const users = await User.find({ email: { $in: emails } })
      .select('_id email')
      .lean<Array<{ _id: { toString: () => string }; email: string }>>();

    const byEmail = new Map<string, string>();
    users.forEach((u) => byEmail.set(String(u.email || '').toLowerCase(), u._id.toString()));

    for (const entry of board.entries || []) {
      if (!entry.userId && entry.email) {
        const linkedId = byEmail.get(String(entry.email).toLowerCase());
        if (linkedId) {
          entry.userId = linkedId;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    await board.save();
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const payload = getRequesterPayload(request);
    const canEdit = !!payload?.phone && EDITOR_PHONES.has(payload.phone);

    const board = await ensureSeededLeaderboard();
    await syncUserLinks(board);

    const userIds = (board.entries || [])
      .map((entry: any) => entry.userId?.toString())
      .filter(Boolean);

    const users = await User.find({ _id: { $in: userIds } })
      .select('_id displayName email')
      .lean<Array<{ _id: { toString: () => string }; displayName: string; email: string }>>();

    const userMap = new Map<string, { id: string; displayName: string; email: string }>();
    users.forEach((user) => {
      userMap.set(user._id.toString(), {
        id: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
      });
    });

    const rows = buildRankedRows(board.entries || [], userMap);

    return NextResponse.json({
      success: true,
      canEdit,
      rows,
      updatedAt: board.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching daily leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily leaderboard' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const payload = getRequesterPayload(request);
    if (!payload?.phone || !EDITOR_PHONES.has(payload.phone)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const incomingRows = Array.isArray(body?.rows) ? body.rows : [];
    if (incomingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'rows are required' }, { status: 400 });
    }

    const board = await ensureSeededLeaderboard();
    const existingById = new Map<string, any>((board.entries || []).map((entry: any) => [entry._id.toString(), entry]));

    const normalizedEmails = incomingRows
      .map((row: any) => String(row.email || '').trim().toLowerCase())
      .filter(Boolean);

    const users = await User.find({ email: { $in: normalizedEmails } })
      .select('_id email')
      .lean<Array<{ _id: { toString: () => string }; email: string }>>();

    const byEmail = new Map<string, string>();
    users.forEach((u) => byEmail.set(String(u.email || '').toLowerCase(), u._id.toString()));

    for (const row of incomingRows) {
      const target: any = existingById.get(String(row.id || ''));
      if (!target) continue;

      const email = String(row.email || '').trim().toLowerCase();
      target.name = String(row.name || target.name || 'Unknown').trim();
      target.email = email;
      target.mp = Math.max(0, Math.floor(toFinite(row.mp, target.mp || 0)));
      target.gain = toFinite(row.gain, target.gain || 0);

      const hasWinsInput = row.wins !== undefined && row.wins !== null && row.wins !== '';
      if (hasWinsInput) {
        const wins = Math.max(0, Math.floor(toFinite(row.wins, 0)));
        const boundedWins = target.mp > 0 ? Math.min(wins, target.mp) : 0;
        target.winPct = target.mp > 0 ? Number(((boundedWins / target.mp) * 100).toFixed(2)) : 0;
      } else {
        target.winPct = Math.max(0, Number(toFinite(row.winPct, target.winPct || 0).toFixed(2)));
      }

      target.userId = email ? byEmail.get(email) : undefined;
    }

    await board.save();

    const linkedUserIds = (board.entries || [])
      .map((entry: any) => entry.userId?.toString())
      .filter(Boolean);

    const linkedUsers = await User.find({ _id: { $in: linkedUserIds } })
      .select('_id displayName email')
      .lean<Array<{ _id: { toString: () => string }; displayName: string; email: string }>>();

    const userMap = new Map<string, { id: string; displayName: string; email: string }>();
    linkedUsers.forEach((user) => {
      userMap.set(user._id.toString(), {
        id: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
      });
    });

    const rows = buildRankedRows(board.entries || [], userMap);

    return NextResponse.json({
      success: true,
      canEdit: true,
      rows,
      updatedAt: board.updatedAt,
    });
  } catch (error) {
    console.error('Error updating daily leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update daily leaderboard' },
      { status: 500 }
    );
  }
}
