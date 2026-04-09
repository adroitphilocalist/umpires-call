export type MatchLifecycleStatus = 'upcoming' | 'live' | 'completed';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function getNormalizedMatchTime(matchDate: Date): Date {
  return new Date(matchDate.getTime() - IST_OFFSET_MS);
}

export function getMatchLifecycleStatus(matchDate: Date, dbStatus?: string): MatchLifecycleStatus {
  if (dbStatus === 'completed') {
    return 'completed';
  }

  const now = new Date();
  const normalizedMatchTime = getNormalizedMatchTime(new Date(matchDate));

  if (now < normalizedMatchTime) {
    return 'upcoming';
  }

  const endTime = new Date(normalizedMatchTime.getTime() + FIVE_HOURS_MS);
  if (now < endTime) {
    return 'live';
  }

  return 'completed';
}

export function isTeamSelectionLocked(matchDate: Date, dbStatus?: string): boolean {
  return getMatchLifecycleStatus(matchDate, dbStatus) !== 'upcoming';
}
