import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { createToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { phone, displayName, username } = await request.json();
    
    if (!phone || !displayName || !username) {
      return NextResponse.json(
        { success: false, error: 'Phone, displayName and username required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    const existingUser = await User.findOne({ $or: [{ phone }, { username }] });
    if (existingUser) {
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { success: false, error: 'Phone already registered' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      );
    }
    
    const user = await User.create({
      phone,
      displayName,
      username,
    });
    
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
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
