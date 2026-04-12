export interface PlayerBreakdown {
  category: string;
  description: string;
  points: number;
}

export interface MatchScoreStats {
  runs?: number;
  balls?: number;
  dots?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  wickets?: number;
  overs?: number;
  maiden?: number;
  economy?: number;
  catches?: number;
  runOuts?: number;
  stumpings?: number;
  lbwBowled?: number;
  playingXI?: number;
  substitute?: number;
}

export interface ScoreDetail {
  points: number;
  stats?: MatchScoreStats;
}

export interface TeamPlayer {
  playerId: string;
  name: string;
  role: string;
  creditCost: number;
  externalId?: string | null;
  points?: number;
  multiplier?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  breakdown?: PlayerBreakdown[];
}

export interface ContestTeam {
  _id: string;
  userId: string;
  contestId: string;
  name: string;
  score?: number;
  rank?: number;
  captainId: string;
  viceCaptainId: string;
  players: TeamPlayer[];
  playerCount?: number;
  isTeamLocked?: boolean;
  user?: {
    _id: string;
    displayName: string;
  } | null;
}

export interface ExpandedPlayerState {
  teamId: string;
  playerId: string;
}
