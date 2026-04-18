import mongoose, { Schema, Document } from 'mongoose';
import { IMatchScoreStats } from './MatchScore';

export interface IPlayerPointsBreakdown {
  category: string;
  description: string;
  points: number;
}

export interface ITeamPlayerFinalResult extends Document {
  matchId: mongoose.Types.ObjectId;
  contestId: mongoose.Types.ObjectId;
  contestFinalResultId: mongoose.Types.ObjectId;
  teamFinalResultId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  rankSnapshot: number;
  playerId: mongoose.Types.ObjectId;
  externalId: string;
  playerName: string;
  role: string;
  creditCost: number;
  basePoints: number;
  finalPoints: number;
  multiplier: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  stats: IMatchScoreStats;
  breakdown: IPlayerPointsBreakdown[];
  finalizedAt: Date;
}

const PlayerPointsBreakdownSchema = new Schema<IPlayerPointsBreakdown>(
  {
    category: { type: String, required: true },
    description: { type: String, required: true },
    points: { type: Number, required: true },
  },
  { _id: false }
);

const MatchScoreStatsSnapshotSchema = new Schema<IMatchScoreStats>(
  {
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    dots: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    maiden: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 },
    lbwBowled: { type: Number, default: 0 },
    playingXI: { type: Number, default: 0 },
    substitute: { type: Number, default: 0 },
  },
  { _id: false }
);

const TeamPlayerFinalResultSchema = new Schema<ITeamPlayerFinalResult>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    contestFinalResultId: { type: Schema.Types.ObjectId, ref: 'ContestFinalResult', required: true, index: true },
    teamFinalResultId: { type: Schema.Types.ObjectId, ref: 'TeamFinalResult', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    rankSnapshot: { type: Number, default: 0 },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    externalId: { type: String, default: '', index: true },
    playerName: { type: String, required: true },
    role: { type: String, default: '' },
    creditCost: { type: Number, default: 0 },
    basePoints: { type: Number, default: 0 },
    finalPoints: { type: Number, default: 0 },
    multiplier: { type: Number, default: 1 },
    isCaptain: { type: Boolean, default: false },
    isViceCaptain: { type: Boolean, default: false },
    stats: { type: MatchScoreStatsSnapshotSchema, default: () => ({}) },
    breakdown: [PlayerPointsBreakdownSchema],
    finalizedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TeamPlayerFinalResultSchema.index({ teamFinalResultId: 1, playerId: 1 }, { unique: true });
TeamPlayerFinalResultSchema.index({ userId: 1, matchId: 1 });
TeamPlayerFinalResultSchema.index({ playerId: 1, matchId: 1 });
TeamPlayerFinalResultSchema.index({ userId: 1, playerId: 1 });
TeamPlayerFinalResultSchema.index({ contestId: 1, rankSnapshot: 1 });

export const TeamPlayerFinalResult =
  mongoose.models.TeamPlayerFinalResult ||
  mongoose.model<ITeamPlayerFinalResult>('TeamPlayerFinalResult', TeamPlayerFinalResultSchema);
