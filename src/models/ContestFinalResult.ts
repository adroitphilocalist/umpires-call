import mongoose, { Schema, Document } from 'mongoose';

export interface IContestFinalResult extends Document {
  matchId: mongoose.Types.ObjectId;
  contestId: mongoose.Types.ObjectId;
  contestName: string;
  matchName: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  completedAt: Date;
  totalTeams: number;
  isSaved: boolean;
  finalizationVersion: number;
  finalizedByUserId?: mongoose.Types.ObjectId;
  finalizedByPhone?: string;
  finalizationRunId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ContestFinalResultSchema = new Schema<IContestFinalResult>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, unique: true },
    contestName: { type: String, default: '' },
    matchName: { type: String, default: '' },
    entryFee: { type: Number, default: 0 },
    prizePool: { type: Number, default: 0 },
    maxParticipants: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
    totalTeams: { type: Number, default: 0 },
    isSaved: { type: Boolean, default: false },
    finalizationVersion: { type: Number, default: 1 },
    finalizedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    finalizedByPhone: { type: String, default: '' },
    finalizationRunId: { type: Schema.Types.ObjectId, ref: 'FinalizationRun' },
  },
  { timestamps: true }
);

ContestFinalResultSchema.index({ matchId: 1, completedAt: -1 });
ContestFinalResultSchema.index({ finalizedByUserId: 1, completedAt: -1 });

export const ContestFinalResult = mongoose.models.ContestFinalResult ||
  mongoose.model<IContestFinalResult>('ContestFinalResult', ContestFinalResultSchema);
