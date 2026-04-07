import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Otp } from '@/models/Otp';
import { createToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();
    console.log('[DEBUG] Attempting Email OTP lookup for:', { email, otp });

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 });
    }

    await dbConnect();

    // Verify OTP
    const otpRecord = await Otp.findOne({ email, otp });
    console.log('[DEBUG] OTP lookup result:', otpRecord);
    
    if (!otpRecord) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check logical expiration to protect against MongoDB TTL time-drift issues
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
    }

    // OTP verified, find user
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Delete OTP record as it has been used
    await Otp.deleteOne({ _id: otpRecord._id });

    const token = createToken({
      userId: user._id.toString(),
      phone: user.phone,
      email: user.email,
      displayName: user.displayName,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        _id: user._id.toString(),
        phone: user.phone,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
