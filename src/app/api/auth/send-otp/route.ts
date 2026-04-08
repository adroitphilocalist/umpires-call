import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Otp } from '@/models/Otp';
import { User } from '@/models/User';
import { sendEmailOTP } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email: identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Identifier required' }, { status: 400 });
    }

    await dbConnect();

    // Try finding by username or email first
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });

    // Determine target email
    const targetEmail = user ? user.email : identifier.toLowerCase();

    // Prevent non-emails from proceeding if user is not found
    if (!targetEmail.includes('@')) {
       return NextResponse.json({ success: false, error: 'User not found or invalid email.' }, { status: 404 });
    }

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email: targetEmail });

    // Generate a 6 digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const createdOtp = await Otp.create({
      email: targetEmail,
      otp: otpCode,
      expiresAt,
    });
    console.log('[DEBUG] OTP created in database:', createdOtp);

    const isSent = await sendEmailOTP(targetEmail, otpCode);

    if (!isSent) {
      return NextResponse.json({ success: false, error: 'Failed to dispatch Email through provider.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
