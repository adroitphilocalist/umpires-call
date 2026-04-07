import { loadEnvConfig } from '@next/env';
import fs from 'fs';
import path from 'path';
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

interface MergedMatch {
  team1: string;
  team2: string;
  venue: string;
  date: string;
  url: string;
  id: number;
}

export async function updateMatchesFromMerged() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    const dataPath = path.join(process.cwd(), 'merged.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const matchesData: MergedMatch[] = JSON.parse(rawData);

    console.log(`Loaded ${matchesData.length} matches from merged.json`);

    let updatedCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < matchesData.length; i++) {
      const m = matchesData[i];
      const matchNumber = i + 1;

      const team1Short = TEAM_SHORT_MAP[m.team1] || m.team1.substring(0, 3).toUpperCase();
      const team2Short = TEAM_SHORT_MAP[m.team2] || m.team2.substring(0, 3).toUpperCase();

      const updateData = {
        team1: { name: m.team1, shortName: team1Short },
        team2: { name: m.team2, shortName: team2Short },
        venue: m.venue,
        date: new Date(m.date),
        cricbuzzId: String(m.id),
        scorecardUrl: m.url,
      };

      const result = await Match.updateOne(
        { matchNumber },
        { $set: updateData }
      );

      if (result.modifiedCount > 0) {
        console.log(`Updated match ${matchNumber}: ${m.team1} vs ${m.team2}`);
        updatedCount++;
      } else {
        const existing = await Match.findOne({ matchNumber });
        if (existing) {
          console.log(`Match ${matchNumber} found but not modified (same data?)`);
        } else {
          console.log(`Match ${matchNumber} NOT FOUND in database`);
          notFoundCount++;
        }
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Not found: ${notFoundCount}`);
    console.log(`Total in merged.json: ${matchesData.length}`);

    const dbCount = await Match.countDocuments();
    console.log(`Total in database: ${dbCount}`);

    return { updated: updatedCount, notFound: notFoundCount };
  } catch (error) {
    console.error('Error updating matches:', error);
    throw error;
  }
}

export default updateMatchesFromMerged;

if (process.argv[1]?.endsWith('update-matches.ts')) {
  updateMatchesFromMerged()
    .then((result) => {
      console.log(`\nUpdate completed: ${result.updated} updated, ${result.notFound} not found`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}