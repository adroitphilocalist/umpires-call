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
  },
  { timestamps: true }
);

export const ContestFinalResult = mongoose.models.ContestFinalResult ||
  mongoose.model<IContestFinalResult>('ContestFinalResult', ContestFinalResultSchema);
