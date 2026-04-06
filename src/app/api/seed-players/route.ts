import { NextResponse } from 'next/server';
import { seedPlayersV2 } from '@/lib/seed-players-v2';

export async function GET() {
  try {
    const count = await seedPlayersV2();
    return NextResponse.json({ success: true, message: `Seeded ${count} players successfully`, count });
  } catch (error) {
    console.error('Error seeding players:', error);
    return NextResponse.json({ success: false, message: 'Failed to seed players' }, { status: 500 });
  }
}
