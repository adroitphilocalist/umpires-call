import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  team1: { name: string; shortName: string };
  team2: { name: string; shortName: string };
  venue: string;
  date: Date;
  status: 'upcoming' | 'live' | 'completed';
  format: 'T20' | 'ODI' | 'Test';
  season?: string;
  matchNumber?: number;
  liveScore?: {
    team1Score: string;
    team2Score: string;
    team1Wickets: number;
    team2Wickets: number;
    team1Overs: number;
    team2Overs: number;
    currentInning: number;
    battingTeam: string;
  };
  createdAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    team1: { type: { name: String, shortName: String }, required: true },
    team2: { type: { name: String, shortName: String }, required: true },
    venue: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed'],
      default: 'upcoming',
    },
    format: {
      type: String,
      enum: ['T20', 'ODI', 'Test'],
      default: 'T20',
    },
    season: { type: String },
    matchNumber: { type: Number },
    liveScore: {
      team1Score: String,
      team2Score: String,
      team1Wickets: Number,
      team2Wickets: Number,
      team1Overs: Number,
      team2Overs: Number,
      currentInning: Number,
      battingTeam: String,
    },
  },
  { timestamps: true }
);

export const Match = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);