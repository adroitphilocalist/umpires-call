import { loadEnvConfig } from '@next/env';
import fs from 'fs';
import path from 'path';
import dbConnect from './mongodb';
import { Player } from '../models/Player';

loadEnvConfig(process.cwd());

interface RawPlayer {
  id?: string;
  name: string;
  role: string;
  captain?: boolean;
  isHeader?: boolean;
}

interface TeamData {
  player: RawPlayer[];
}

const TEAM_MAP: Record<string, string> = {
  CSK: 'Chennai Super Kings',
  DC: 'Delhi Capitals',
  GT: 'Gujarat Titans',
  RCB: 'Royal Challengers Bangalore',
  PBKS: 'Punjab Kings',
  KKR: 'Kolkata Knight Riders',
  SRH: 'Sunrisers Hyderabad',
  LSG: 'Lucknow Super Giants',
  RR: 'Rajasthan Royals',
  MI: 'Mumbai Indians',
};

const ROLE_MAP: Record<string, string> = {
  'Batsman': 'batsman',
  'Batting Allrounder': 'all-rounder',
  'Bowling Allrounder': 'all-rounder',
  'WK-Batsman': 'wicket-keeper',
  'Bowler': 'bowler',
};

function getCreditValue(role: string, isCaptain: boolean): number {
  const mappedRole = ROLE_MAP[role] || role;
  
  if (isCaptain) {
    if (mappedRole === 'batsman') return 11;
    if (mappedRole === 'all-rounder') return 10;
    if (mappedRole === 'bowler') return 10;
    if (mappedRole === 'wicket-keeper') return 10;
  }

  switch (mappedRole) {
    case 'batsman':
      return 8;
    case 'wicket-keeper':
      return 9;
    case 'all-rounder':
      return 9;
    case 'bowler':
      return 8;
    default:
      return 8;
  }
}

export async function seedPlayersV2() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    const dataPath = path.join(process.cwd(), 'teams.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const teamsData: Record<string, TeamData> = JSON.parse(rawData);

    const playerKeys = Object.keys(teamsData);
    console.log(`Found ${playerKeys.length} teams: ${playerKeys.join(', ')}`);

    await Player.deleteMany({});
    console.log('Cleared existing players');

    const playersToInsert: any[] = [];

    for (const teamKey of playerKeys) {
      const team = teamsData[teamKey];
      if (!team || !team.player) continue;

      const teamName = TEAM_MAP[teamKey] || teamKey;
      console.log(`Processing ${teamKey}: ${teamName}`);

      for (const player of team.player) {
        if (player.isHeader) continue;
        if (!player.id || !player.name) continue;

        const mappedRole = ROLE_MAP[player.role] || 'batsman';
        const creditValue = getCreditValue(player.role, !!player.captain);

        playersToInsert.push({
          name: player.name,
          externalId: player.id,
          role: mappedRole,
          team: teamName,
          creditValue: creditValue,
          stats: {
            matches: 0,
          },
        });
      }
    }

    await Player.insertMany(playersToInsert);
    console.log(`Inserted ${playersToInsert.length} players`);

    const count = await Player.countDocuments();
    console.log(`Total players in database: ${count}`);

    console.log('Seed V2 completed successfully');
    return playersToInsert.length;
  } catch (error) {
    console.error('Error seeding players:', error);
    throw error;
  }
}

export default seedPlayersV2;

if (process.argv[1]?.endsWith('seed-players-v2.ts')) {
  seedPlayersV2()
    .then((count) => {
      console.log(`Seeded ${count} players successfully.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Player seed V2 failed:', error);
      process.exit(1);
    });
}