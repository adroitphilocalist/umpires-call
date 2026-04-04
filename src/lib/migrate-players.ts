import mongoose from 'mongoose';
import { loadEnvConfig } from '@next/env';
import dbConnect from './mongodb';
import { Team, ITeam } from '../models/Team';
import { Player, IPlayer } from '../models/Player';

loadEnvConfig(process.cwd());

async function migratePlayerIds(): Promise<void> {
  await dbConnect();

  const teams = await Team.find().lean<ITeam[]>();
  console.log(`Found ${teams.length} teams to migrate`);

  for (const team of teams) {
    console.log(`Processing team: ${team.name}`);

    const updatedPlayers = [...team.players];
    let newCaptainId = team.captainId;
    let newViceCaptainId = team.viceCaptainId;

    const playerNameToNewId: Map<string, mongoose.Types.ObjectId> = new Map();

    for (const teamPlayer of team.players) {
      const player = await Player.findOne({ name: teamPlayer.name }).lean<IPlayer>();
      if (player) {
        playerNameToNewId.set(teamPlayer.name, player._id as mongoose.Types.ObjectId);
      }
    }

    for (let i = 0; i < updatedPlayers.length; i++) {
      const teamPlayer = updatedPlayers[i];
      const newId = playerNameToNewId.get(teamPlayer.name);

      if (newId) {
        updatedPlayers[i] = {
          ...teamPlayer,
          playerId: newId,
        };
        console.log(`  Updated player: ${teamPlayer.name} -> ${newId}`);
      } else {
        console.log(`  Player not found: ${teamPlayer.name}`);
      }
    }

    const oldCaptain = team.players.find(p => p.playerId.toString() === team.captainId.toString());
    if (oldCaptain) {
      const captainNewId = playerNameToNewId.get(oldCaptain.name);
      if (captainNewId) {
        newCaptainId = captainNewId;
        console.log(`  Updated captainId: ${oldCaptain.name}`);
      }
    }

    const oldViceCaptain = team.players.find(p => p.playerId.toString() === team.viceCaptainId.toString());
    if (oldViceCaptain) {
      const viceCaptainNewId = playerNameToNewId.get(oldViceCaptain.name);
      if (viceCaptainNewId) {
        newViceCaptainId = viceCaptainNewId;
        console.log(`  Updated viceCaptainId: ${oldViceCaptain.name}`);
      }
    }

    await Team.updateOne(
      { _id: team._id },
      {
        $set: {
          players: updatedPlayers,
          captainId: newCaptainId,
          viceCaptainId: newViceCaptainId,
        },
      }
    );

    console.log(`  Team ${team.name} updated successfully`);
  }

  console.log('Migration complete');
}

export default migratePlayerIds;

if (require.main === module) {
  migratePlayerIds()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}