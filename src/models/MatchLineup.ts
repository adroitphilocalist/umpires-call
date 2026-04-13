import mongoose, { Schema, Document } from 'mongoose';

export type LineupResolution = 'exact' | 'fuzzy' | 'unresolved';

export interface ILineupPlayer extends Document {
  rawName: string;
  normalizedName: string;
  playerId?: mongoose.Types.ObjectId;
  externalId?: string;
  playerName?: string;
  confidence: number;
  resolution: LineupResolution;
}

export interface ITeamLineup {
  teamName: string;
  playingXI: ILineupPlayer[];
  impactSubs: ILineupPlayer[];
}

export interface IMatchLineup extends Document {
  matchId: mongoose.Types.ObjectId;
  rawText: string;
  team1: ITeamLineup;
  team2: ITeamLineup;
  validation: {
    errors: string[];
    warnings: string[];
  };
  status: 'draft' | 'approved';
  approvedBy?: string;
  approvedAt?: Date;
  parsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LineupPlayerSchema = new Schema<ILineupPlayer>(
  {
    rawName: { type: String, required: true },
    normalizedName: { type: String, required: true },
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    externalId: { type: String, default: '' },
    playerName: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    resolution: {
      type: String,
      enum: ['exact', 'fuzzy', 'unresolved'],
      default: 'unresolved',
    },
  },
  { _id: false }
);

const TeamLineupSchema = new Schema<ITeamLineup>(
  {
    teamName: { type: String, required: true },
    playingXI: { type: [LineupPlayerSchema], default: [] },
    impactSubs: { type: [LineupPlayerSchema], default: [] },
  },
  { _id: false }
);

const MatchLineupSchema = new Schema<IMatchLineup>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, unique: true, index: true },
    rawText: { type: String, default: '' },
    team1: { type: TeamLineupSchema, required: true },
    team2: { type: TeamLineupSchema, required: true },
    validation: {
      errors: { type: [String], default: [] },
      warnings: { type: [String], default: [] },
    },
    status: {
      type: String,
      enum: ['draft', 'approved'],
      default: 'draft',
      index: true,
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    parsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MatchLineup =
  mongoose.models.MatchLineup || mongoose.model<IMatchLineup>('MatchLineup', MatchLineupSchema);
