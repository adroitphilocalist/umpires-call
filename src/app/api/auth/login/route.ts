import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { createToken } from '@/lib/jwt';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Phone required' }, { status: 400 });
  }
  
  await dbConnect();
  const user = await User.findOne({ phone });
  
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }
  
  const token = createToken({
    userId: user._id.toString(),
    phone: user.phone,
    displayName: user.displayName,
  });
  
  return NextResponse.json({
    success: true,
    token,
    user: {
      _id: user._id.toString(),
      phone: user.phone,
      displayName: user.displayName,
      username: user.username,
    }
  });
}
