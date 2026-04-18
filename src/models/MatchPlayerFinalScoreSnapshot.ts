import mongoose, { Schema, Document } from 'mongoose';
import { IMatchScoreStats } from './MatchScore';

export interface IMatchPlayerFinalScoreSnapshot extends Document {
  matchId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  externalId: string;
  playerName: string;
  role: string;
  team: string;
  points: number;
  stats: IMatchScoreStats;
  finalizedAt: Date;
  finalizationRunId?: mongoose.Types.ObjectId;
}

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

const MatchPlayerFinalScoreSnapshotSchema = new Schema<IMatchPlayerFinalScoreSnapshot>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
    externalId: { type: String, default: '', index: true },
    playerName: { type: String, default: '' },
    role: { type: String, default: '' },
    team: { type: String, default: '' },
    points: { type: Number, default: 0 },
    stats: { type: MatchScoreStatsSnapshotSchema, default: () => ({}) },
    finalizedAt: { type: Date, default: Date.now },
    finalizationRunId: { type: Schema.Types.ObjectId, ref: 'FinalizationRun' },
  },
  { timestamps: true }
);

MatchPlayerFinalScoreSnapshotSchema.index({ matchId: 1, playerId: 1 }, { unique: true });
MatchPlayerFinalScoreSnapshotSchema.index({ matchId: 1, points: -1 });
MatchPlayerFinalScoreSnapshotSchema.index({ playerId: 1, finalizedAt: -1 });

export const MatchPlayerFinalScoreSnapshot =
  mongoose.models.MatchPlayerFinalScoreSnapshot ||
  mongoose.model<IMatchPlayerFinalScoreSnapshot>(
    'MatchPlayerFinalScoreSnapshot',
    MatchPlayerFinalScoreSnapshotSchema
  );
