import mongoose, { Schema, Document } from 'mongoose';

export interface IMatchScoreStats {
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

export interface IMatchScore extends Document {
  matchId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  externalId: string;
  points: number;
  stats: IMatchScoreStats;
  lastUpdated: Date;
}

const MatchScoreStatsSchema = new Schema<IMatchScoreStats>(
  {
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    maiden: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 },
  },
  { _id: false }
);

const MatchScoreSchema = new Schema<IMatchScore>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    externalId: { type: String, required: true, index: true },
    points: { type: Number, default: 0 },
    stats: { type: MatchScoreStatsSchema, default: () => ({}) },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MatchScoreSchema.index({ matchId: 1, playerId: 1 }, { unique: true });

export const MatchScore = mongoose.models.MatchScore || mongoose.model<IMatchScore>('MatchScore', MatchScoreSchema);