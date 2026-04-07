import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Otp } from '@/models/Otp';
import { sendEmailOTP } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    await dbConnect();

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });

    // Generate a 6 digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const createdOtp = await Otp.create({
      email,
      otp: otpCode,
      expiresAt,
    });
    console.log('[DEBUG] OTP created in database:', createdOtp);

    const isSent = await sendEmailOTP(email, otpCode);

    if (!isSent) {
      return NextResponse.json({ success: false, error: 'Failed to dispatch Email through provider.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 });
  }
}
