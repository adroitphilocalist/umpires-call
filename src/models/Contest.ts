import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
  name: string;
  description: string;
  matchId: mongoose.Types.ObjectId;
  entryFee: number;
  maxParticipants: number;
  prizePool: number;
  creatorId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  status: 'open' | 'filled' | 'completed';
  inviteCode: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
}

const ContestSchema = new Schema<IContest>(
  {
    name: { type: String, required: true },
    description: { type: String },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    entryFee: { type: Number, required: true, default: 0 },
    maxParticipants: { type: Number, required: true, default: 100 },
    prizePool: { type: Number, default: 0 },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['open', 'filled', 'completed'],
      default: 'open',
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    inviteCode: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export const Contest = mongoose.models.Contest || mongoose.model<IContest>('Contest', ContestSchema);