import { NextResponse } from 'next/server';
import { seedPlayers } from '@/lib/seed-players';

export async function GET() {
  try {
    const count = await seedPlayers();
    return NextResponse.json({ success: true, message: `Seeded ${count} players successfully`, count });
  } catch (error) {
    console.error('Error seeding players:', error);
    return NextResponse.json({ success: false, message: 'Failed to seed players' }, { status: 500 });
  }
}