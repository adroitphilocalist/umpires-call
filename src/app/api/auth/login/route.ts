import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Otp } from '@/models/Otp';
import { createToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email: identifier, otp, password } = await request.json();

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Email or Username is required' }, { status: 400 });
    }
    if (!otp && !password) {
      return NextResponse.json({ success: false, error: 'OTP or Password is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ 
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });
    
    // We retain actual email for OTP verify lookup
    const email = user ? user.email : identifier.toLowerCase();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (password) {
      if (!user.password) {
         return NextResponse.json({ success: false, error: 'No password set. Please log in with OTP.' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 400 });
      }
    } else if (otp) {
      // Verify OTP
      const otpRecord = await Otp.findOne({ email, otp });
      
      if (!otpRecord) {
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
      }

      // Check logical expiration
      if (new Date() > new Date(otpRecord.expiresAt)) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 });
      }
      
      // Delete OTP record as it has been used
      await Otp.deleteOne({ _id: otpRecord._id });
    }

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
