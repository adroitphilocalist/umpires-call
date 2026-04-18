import mongoose, { Schema, Document } from 'mongoose';

export interface IFinalizationRunSummary {
  totalContests: number;
  savedContests: number;
  skippedContests: number;
  totalTeams: number;
}

export interface IFinalizationRun extends Document {
  matchId: mongoose.Types.ObjectId;
  contestId?: mongoose.Types.ObjectId;
  mode: 'all' | 'single';
  status: 'running' | 'completed' | 'failed';
  triggeredByUserId?: mongoose.Types.ObjectId;
  triggeredByPhone: string;
  startedAt: Date;
  completedAt?: Date;
  summary: IFinalizationRunSummary;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinalizationRunSummarySchema = new Schema<IFinalizationRunSummary>(
  {
    totalContests: { type: Number, default: 0 },
    savedContests: { type: Number, default: 0 },
    skippedContests: { type: Number, default: 0 },
    totalTeams: { type: Number, default: 0 },
  },
  { _id: false }
);

const FinalizationRunSchema = new Schema<IFinalizationRun>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', index: true },
    mode: { type: String, enum: ['all', 'single'], default: 'all' },
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running', index: true },
    triggeredByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    triggeredByPhone: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    summary: { type: FinalizationRunSummarySchema, default: () => ({}) },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

FinalizationRunSchema.index({ matchId: 1, startedAt: -1 });
FinalizationRunSchema.index({ contestId: 1, startedAt: -1 });
FinalizationRunSchema.index({ triggeredByUserId: 1, startedAt: -1 });

export const FinalizationRun =
  mongoose.models.FinalizationRun ||
  mongoose.model<IFinalizationRun>('FinalizationRun', FinalizationRunSchema);
