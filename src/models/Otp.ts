import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }, 
    expiresAt: { type: Date, required: true },
  }
);

export const Otp = mongoose.models.VerificationCode || mongoose.model<IOtp>('VerificationCode', OtpSchema);
