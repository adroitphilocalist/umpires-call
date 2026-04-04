import { loadEnvConfig } from '@next/env';
import fs from 'fs';
import path from 'path';
import dbConnect from './mongodb';
import { Player } from '../models/Player';

loadEnvConfig(process.cwd());

const TEAM_MAP: Record<string, string> = {
  CSK: 'Chennai Super Kings',
  DC: 'Delhi Capitals',
  GT: 'Gujarat Titans',
  RCB: 'Royal Challengers Bangalore',
  PBKS: 'Punjab Kings',
  KKR: 'Kolkata Knight Riders',
  LSG: 'Lucknow Super Giants',
  MI: 'Mumbai Indians',
  RR: 'Rajasthan Royals',
  SRH: 'Sunrisers Hyderabad',
};

const ROLE_MAP: Record<string, string> = {
  batter: 'batsman',
  bowler: 'bowler',
  allrounder: 'all-rounder',
  wicketkeeper: 'wicket-keeper',
};

const CREDIT_MAP: Record<string, number> = {
  batsman: 9,
  bowler: 8.5,
  'all-rounder': 9,
  'wicket-keeper': 8.5,
};

interface RawPlayer {
  id: string;
  name: string;
  team: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  captain: boolean;
}

export async function seedPlayers() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    const dataPath = path.join(process.cwd(), 'cleaned_players.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const rawPlayers: RawPlayer[] = JSON.parse(rawData);

    console.log(`Loaded ${rawPlayers.length} players from JSON`);

    await Player.deleteMany({});
    console.log('Cleared existing players');

    const players = rawPlayers.map((p) => {
      const mappedRole = ROLE_MAP[p.role] || p.role;
      return {
        name: p.name,
        externalId: p.id,
        role: mappedRole,
        team: TEAM_MAP[p.team] || p.team,
        creditValue: CREDIT_MAP[mappedRole] || 8,
        stats: {
          matches: 0,
        },
      };
    });

    await Player.insertMany(players);
    console.log(`Inserted ${players.length} players`);

    console.log('Seed completed successfully');
    return players.length;
  } catch (error) {
    console.error('Error seeding players:', error);
    throw error;
  }
}

export default seedPlayers;

if (process.argv[1]?.endsWith('src/lib/seed-players.ts')) {
  seedPlayers()
    .then((count) => {
      console.log(`Seeded ${count} players successfully.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Player seed failed:', error);
      process.exit(1);
    });
}