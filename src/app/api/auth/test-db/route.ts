import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Otp } from '@/models/Otp';

export async function GET() {
  await dbConnect();
  const otps = await Otp.find({});
  return NextResponse.json({ success: true, otps });
}
