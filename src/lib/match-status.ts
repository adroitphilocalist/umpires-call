import mongoose from 'mongoose';
import { Match, IMatch } from '@/models/Match';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

export type MatchStatus = 'upcoming' | 'live' | 'completed';

export function getMatchStatus(matchDate: Date): MatchStatus {
  const now = new Date();
  const matchTime = new Date(matchDate);

  if (now < matchTime) {
    return 'upcoming';
  }

  const endTime = new Date(matchTime.getTime() + FIVE_HOURS_MS);

  if (now >= matchTime && now < endTime) {
    return 'live';
  }

  return 'completed';
}

interface StatusSummary {
  upcoming: number;
  live: number;
  completed: number;
}

export async function updateMatchStatuses(): Promise<StatusSummary> {
  const summary: StatusSummary = {
    upcoming: 0,
    live: 0,
    completed: 0,
  };

  const matches = await Match.find({});
  const now = new Date();

  for (const match of matches) {
    const newStatus = getMatchStatus(match.date);

    if (match.status !== newStatus) {
      match.status = newStatus;
      await match.save();
    }

    summary[newStatus]++;
  }

  return summary;
}