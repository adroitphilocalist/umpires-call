import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    // Check if user already exists with phone
    const existingUser = await User.findOne({ phone: data.phone });
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        user: {
          ...existingUser.toObject(),
          _id: existingUser._id.toString(),
        },
      });
    }
    
    // Create new user
    const user = await User.create({
      phone: data.phone,
      displayName: data.displayName,
      username: data.username || `user_${Date.now()}`,
      avatar: data.avatar,
      credits: 1000,
    });
    
    return NextResponse.json({
      success: true,
      user: {
        ...user.toObject(),
        _id: user._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (phone) {
      const user = await User.findOne({ phone });
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        user: {
          ...user.toObject(),
          _id: user._id.toString(),
        },
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Phone number required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}