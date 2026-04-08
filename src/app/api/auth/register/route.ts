import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Otp } from '@/models/Otp';
import { createToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { phone, email, displayName, username, password, otp } = await request.json();
    
    if (!phone || !email || !displayName || !username || !password || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone, email, displayName, username, password, and OTP are required' },
        { status: 400 }
      );
    }
    
    await dbConnect();

    // Verify OTP first using email
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check logical expiration
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
    }
    
    const existingUser = await User.findOne({ $or: [{ phone }, { username }, { email }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
      }
      if (existingUser.phone === phone) {
        return NextResponse.json({ success: false, error: 'Phone already registered' }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 409 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      phone,
      email,
      displayName,
      username,
      password: hashedPassword,
    });

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
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
