import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerPointsBreakdown {
  category: string;
  description: string;
  points: number;
}

export interface ITeamPlayerResult {
  playerId: mongoose.Types.ObjectId;
  externalId: string;
  playerName: string;
  role: string;
  creditCost: number;
  points: number;
  multiplier: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  breakdown: IPlayerPointsBreakdown[];
}

export interface ITeamFinalResult extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  teamName: string;
  userName: string;
  totalPoints: number;
  rank: number;
  players: ITeamPlayerResult[];
  createdAt: Date;
}

const PlayerPointsBreakdownSchema = new Schema(
  {
    category: { type: String, required: true },
    description: { type: String, required: true },
    points: { type: Number, required: true },
  },
  { _id: false }
);

const TeamPlayerResultSchema = new Schema<ITeamPlayerResult>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    externalId: { type: String, required: true },
    playerName: { type: String, required: true },
    role: { type: String, default: '' },
    creditCost: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    multiplier: { type: Number, default: 1 },
    isCaptain: { type: Boolean, default: false },
    isViceCaptain: { type: Boolean, default: false },
    breakdown: [PlayerPointsBreakdownSchema],
  },
  { _id: false }
);

const TeamFinalResultSchema = new Schema<ITeamFinalResult>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    teamName: { type: String, required: true },
    userName: { type: String, default: '' },
    totalPoints: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    players: [TeamPlayerResultSchema],
  },
  { timestamps: true }
);

// Compound index
TeamFinalResultSchema.index({ contestId: 1, rank: 1 });
TeamFinalResultSchema.index({ userId: 1 });

export const TeamFinalResult = mongoose.models.TeamFinalResult ||
  mongoose.model<ITeamFinalResult>('TeamFinalResult', TeamFinalResultSchema);
