import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  email: string;
  firebaseUid?: string;
  displayName: string;
  username: string;
  avatar?: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firebaseUid: { type: String, sparse: true },
    displayName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    avatar: { type: String },
    credits: { type: Number, default: 1000 },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);