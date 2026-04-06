import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerPointsBreakdown {
  category: string;
  description: string;
  points: number;
}

export interface IPlayerFinalScore extends Document {
  playerId: mongoose.Types.ObjectId;
  externalId: string;
  playerName: string;
  role: string;
  team: string;
  creditValue: number;
  points: number;
  stats: {
    runs: number;
    balls: number;
    dots: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    wickets: number;
    overs: number;
    maidens: number;
    economy: number;
    catches: number;
    runOuts: number;
    stumpings: number;
    lbwBowled: number;
    playingXI: number;
    substitute: number;
  };
  breakdown: IPlayerPointsBreakdown[];
  multiplier: number; // 1 for regular, 2 for captain, 1.5 for vice-captain
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export interface ITeamFinalResult extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  teamName: string;
  userName: string;
  totalPoints: number;
  rank: number;
  players: {
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
  }[];
  createdAt: Date;
}

export interface IContestFinalResult extends Document {
  matchId: mongoose.Types.ObjectId;
  contestId: mongoose.Types.ObjectId;
  contestName: string;
  matchName: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  completedAt: Date;
  teams: mongoose.Types.ObjectId[]; // References to ITeamFinalResult
  totalTeams: number;
}

const PlayerPointsBreakdownSchema = new Schema<IPlayerPointsBreakdown>(
  {
    category: { type: String, required: true },
    description: { type: String, required: true },
    points: { type: Number, required: true },
  },
  { _id: false }
);

const PlayerFinalScoreSchema = new Schema<IPlayerFinalScore>(
  {
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    externalId: { type: String, required: true },
    playerName: { type: String, required: true },
    role: { type: String, default: '' },
    team: { type: String, default: '' },
    creditValue: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    stats: {
      runs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      dots: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      catches: { type: Number, default: 0 },
      runOuts: { type: Number, default: 0 },
      stumpings: { type: Number, default: 0 },
      lbwBowled: { type: Number, default: 0 },
      playingXI: { type: Number, default: 0 },
      substitute: { type: Number, default: 0 },
    },
    breakdown: [PlayerPointsBreakdownSchema],
    multiplier: { type: Number, default: 1 },
    isCaptain: { type: Boolean, default: false },
    isViceCaptain: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient lookups
PlayerFinalScoreSchema.index({ matchId: 1, playerId: 1 });

export const PlayerFinalScore = mongoose.models.PlayerFinalScore ||
  mongoose.model<IPlayerFinalScore>('PlayerFinalScore', PlayerFinalScoreSchema);
