import { loadEnvConfig } from '@next/env';
import dbConnect from './mongodb';
import { Match } from '../models/Match';

loadEnvConfig(process.cwd());

const TEAM_SHORT_MAP: Record<string, string> = {
  'Sunrisers Hyderabad': 'SRH',
  'Royal Challengers Bengaluru': 'RCB',
  'Kolkata Knight Riders': 'KKR',
  'Mumbai Indians': 'MI',
  'Chennai Super Kings': 'CSK',
  'Rajasthan Royals': 'RR',
  'Gujarat Titans': 'GT',
  'Punjab Kings': 'PBKS',
  'Delhi Capitals': 'DC',
  'Lucknow Super Giants': 'LSG',
};

export async function createMatch70() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    const matchData = {
      team1: { name: 'Kolkata Knight Riders', shortName: 'KKR' },
      team2: { name: 'Delhi Capitals', shortName: 'DC' },
      venue: 'Eden Gardens, Kolkata',
      date: new Date('2026-05-24T19:30:00.000+00:00'),
      status: 'upcoming' as const,
      format: 'T20' as const,
      matchNumber: 70,
      cricbuzzId: '150362',
      scorecardUrl: 'https://www.cricbuzz.com/api/mcenter/scorecard/150362',
    };

    const match = await Match.create(matchData);
    console.log('Created match 70:', match._id);
    console.log('Teams:', match.team1.name, 'vs', match.team2.name);
    console.log('Date:', match.date);
    console.log('Cricbuzz ID:', match.cricbuzzId);

    const count = await Match.countDocuments();
    console.log('Total matches in DB:', count);

    return match;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export default createMatch70;

if (process.argv[1]?.endsWith('create-match70.ts')) {
  createMatch70()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}