import { NextResponse } from 'next/server';
import seed from '@/lib/seed';

export async function GET() {
  try {
    const result = await seed();
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      matches: result.matches,
      players: result.players
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, message: 'Failed to seed database' }, { status: 500 });
  }
}