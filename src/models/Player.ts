import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerStats {
  matches: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
}

export interface IPlayer extends Document {
  name: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  team: string;
  creditValue: number;
  image?: string;
  externalId?: string;
  stats: IPlayerStats;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'],
      required: true,
    },
    team: { type: String, required: true },
    creditValue: { type: Number, required: true, default: 8 },
    image: { type: String },
    externalId: { type: String, unique: true, sparse: true, index: true },
    stats: {
      matches: { type: Number, default: 0 },
      runs: { type: Number },
      wickets: { type: Number },
      average: { type: Number },
      strikeRate: { type: Number },
    },
  },
  { timestamps: true }
);

export const Player = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);