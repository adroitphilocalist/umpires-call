import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyLeaderboardEntry {
  name: string;
  email?: string;
  userId?: mongoose.Types.ObjectId;
  mp: number;
  gain: number;
  winPct: number;
}

export interface IDailyLeaderboard extends Document {
  slug: string;
  entries: IDailyLeaderboardEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const DailyLeaderboardEntrySchema = new Schema<IDailyLeaderboardEntry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    mp: { type: Number, required: true, default: 0, min: 0 },
    gain: { type: Number, required: true, default: 0 },
    winPct: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: true }
);

const DailyLeaderboardSchema = new Schema<IDailyLeaderboard>(
  {
    slug: { type: String, required: true, unique: true, default: 'global' },
    entries: { type: [DailyLeaderboardEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const DailyLeaderboard =
  mongoose.models.DailyLeaderboard ||
  mongoose.model<IDailyLeaderboard>('DailyLeaderboard', DailyLeaderboardSchema);
