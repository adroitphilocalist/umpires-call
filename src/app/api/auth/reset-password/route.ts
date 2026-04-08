import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Otp } from '@/models/Otp';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { identifier, otp, password } = await request.json();

    if (!identifier || !otp || !password) {
      return NextResponse.json({ success: false, error: 'Identifier, OTP, and new password are required' }, { status: 400 });
    }

    await dbConnect();

    // Verify User exists
    const user = await User.findOne({ 
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: user.email, otp });
    
    if (!otpRecord) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check logical expiration
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user
    user.password = hashedPassword;
    await user.save();

    // Delete OTP record as it has been used
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
