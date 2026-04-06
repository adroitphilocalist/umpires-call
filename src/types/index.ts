export interface User {
  _id: string;
  phone: string;
  displayName: string;
  username: string;
  avatar?: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  _id: string;
  userId: string;
  contestId: string;
  name: string;
  players: TeamPlayer[];
  totalCredits: number;
  captainId: string;
  viceCaptainId: string;
  score: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamPlayer {
  playerId: string;
  name: string;
  role: PlayerRole;
  creditCost: number;
  image?: string;
}

export type PlayerRole = 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';

export interface Player {
  _id: string;
  name: string;
  role: PlayerRole;
  team: string;
  creditValue: number;
  image?: string;
  stats: PlayerStats;
  externalId?: string;
}

export interface PlayerStats {
  matches: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
}

export interface Match {
  _id: string;
  team1: TeamInfo;
  team2: TeamInfo;
  venue: string;
  date: Date;
  status: MatchStatus;
  format: MatchFormat;
  createdAt: Date;
  liveScore?: LiveScore;
  cricbuzzId?: string;
  scorecardUrl?: string;
  lastScoreUpdate?: Date;
}

export interface TeamInfo {
  name: string;
  shortName: string;
}

export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type MatchFormat = 'T20' | 'ODI' | 'Test';

export interface LiveScore {
  team1Score: string;
  team2Score: string;
  team1Wickets: number;
  team2Wickets: number;
  team1Overs: number;
  team2Overs: number;
  currentInning: number;
  battingTeam: string;
}

export interface Contest {
  _id: string;
  name: string;
  description: string;
  matchId: string;
  match?: Match;
  entryFee: number;
  maxParticipants: number;
  prizePool: number;
  creatorId: string;
  participants: string[];
  participantCount: number;
  status: ContestStatus;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  inviteCode?: string;
}

export type ContestStatus = 'open' | 'filled' | 'completed';

export interface AuthUser {
  _id: string;
  phone: string;
  displayName: string;
  username: string;
  avatar?: string;
  credits: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MatchScoreStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  wickets: number;
  overs: number;
  maiden: number;
  economy: number;
  catches: number;
  runOuts: number;
}

export interface MatchScore {
  _id: string;
  matchId: string;
  playerId: string;
  externalId: string;
  points: number;
  stats: MatchScoreStats;
  lastUpdated: Date;
}