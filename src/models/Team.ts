import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamPlayer {
  playerId: mongoose.Types.ObjectId;
  name: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  creditCost: number;
  image?: string;
}

export interface ITeam extends Document {
  userId: mongoose.Types.ObjectId;
  contestId: mongoose.Types.ObjectId;
  name: string;
  players: ITeamPlayer[];
  totalCredits: number;
  captainId: mongoose.Types.ObjectId;
  viceCaptainId: mongoose.Types.ObjectId;
  score: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
    name: { type: String, required: true },
    players: [
      {
        playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
        name: { type: String, required: true },
        role: {
          type: String,
          enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'],
          required: true,
        },
        creditCost: { type: Number, required: true },
        image: String,
      },
    ],
    totalCredits: { type: Number, required: true, default: 100 },
    captainId: { type: Schema.Types.ObjectId, required: true },
    viceCaptainId: { type: Schema.Types.ObjectId, required: true },
    score: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);