function battingPoints(p) {
  let pts = 0;

  const runs = p.runs;
  const fours = p.fours;
  const sixes = p.sixes;
  const balls = p.balls;
  const sr = p.strikeRate;

  pts += runs;
  pts += fours * 4;
  pts += sixes * 6;

  if (runs >= 100) pts += 16;
  else if (runs >= 75) pts += 12;
  else if (runs >= 50) pts += 8;
  else if (runs >= 25) pts += 4;

  if (runs === 0 && balls > 0) pts -= 2;

  if (balls >= 10) {
    if (sr > 170) pts += 6;
    else if (sr > 150) pts += 4;
    else if (sr >= 130) pts += 2;
    else if (sr < 50) pts -= 6;
    else if (sr < 60) pts -= 4;
    else if (sr < 70) pts -= 2;
  }

  return pts;
}

function bowlingPoints(p) {
  let pts = 0;

  const wickets = p.wickets;
  const economy = p.economy;
  const overs = p.overs;

  pts += wickets * 30;

  if (wickets >= 5) pts += 12;
  else if (wickets === 4) pts += 8;
  else if (wickets === 3) pts += 4;

  pts += p.maidens * 12;

  if (overs >= 2) {
    if (economy < 5) pts += 6;
    else if (economy < 6) pts += 4;
    else if (economy <= 7) pts += 2;
    else if (economy >= 12) pts -= 6;
    else if (economy >= 11) pts -= 4;
    else if (economy >= 10) pts -= 2;
  }

  return pts;
}

function fieldingPoints(playerId, scorecards) {
  let pts = 0;

  scorecards.forEach(innings => {
    const batsmen = innings.batTeamDetails.batsmenData;

    Object.values(batsmen).forEach(b => {
      if (b.fielderId1 === playerId) {
        pts += 8;
      }
    });
  });

  return pts;
}

function processMatch(data) {
  const players = {};
  const scorecards = data.scoreCard;

  scorecards.forEach(innings => {
    const batsmen = innings.batTeamDetails.batsmenData;
    Object.values(batsmen).forEach(b => {
      const id = b.batId;

      if (!players[id]) {
        players[id] = {
          name: b.batName,
          points: 0,
          stats: {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            wickets: 0,
            overs: 0,
            maiden: 0,
            economy: 0,
            catches: 0,
            runOuts: 0
          }
        };
      }

      players[id].points += battingPoints(b);
      players[id].stats.runs += parseInt(b.runs) || 0;
      players[id].stats.balls += parseInt(b.balls) || 0;
      players[id].stats.fours += parseInt(b.fours) || 0;
      players[id].stats.sixes += parseInt(b.sixes) || 0;
      players[id].stats.strikeRate = parseFloat(b.strikeRate) || 0;
      players[id].stats.catches += parseInt(b.caught) || 0;
      players[id].stats.runOuts += (parseInt(b.runOut) || 0);
    });

    const bowlers = innings.bowlTeamDetails.bowlersData;
    Object.values(bowlers).forEach(bw => {
      const id = bw.bowlerId;

      if (!players[id]) {
        players[id] = {
          name: bw.bowlName,
          points: 0,
          stats: {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            wickets: 0,
            overs: 0,
            maiden: 0,
            economy: 0,
            catches: 0,
            runOuts: 0
          }
        };
      }

      players[id].points += bowlingPoints(bw);
      players[id].stats.wickets += parseInt(bw.wicket) || 0;
      players[id].stats.overs += parseFloat(bw.overs) || 0;
      players[id].stats.maiden += parseInt(bw.maiden) || 0;
      players[id].stats.runs += parseInt(bw.givenRuns) || 0;
      players[id].stats.economy = parseFloat(bw.economy) || 0;
    });
  });

  Object.keys(players).forEach(id => {
    players[id].points += fieldingPoints(parseInt(id), scorecards);
  });

  return players;
}

async function runPointsUpdater() {
  console.log(`[${new Date().toISOString()}] Fetching live matches...`);

  try {
    const matchesRes = await fetch('http://localhost:3000/api/matches/live');
    
    if (!matchesRes.ok) {
      throw new Error(`Failed to fetch live matches: ${matchesRes.status}`);
    }

    const liveMatches = await matchesRes.json();

    if (!Array.isArray(liveMatches) || liveMatches.length === 0) {
      console.log(`[${new Date().toISOString()}] No live matches found.`);
      return;
    }

    console.log(`[${new Date().toISOString()}] Found ${liveMatches.length} live match(es)`);

    for (const match of liveMatches) {
      try {
        console.log(`[${new Date().toISOString()}] Processing match: ${match.matchId}`);

        const scorecardRes = await fetch(match.scorecardUrl);

        if (!scorecardRes.ok) {
          throw new Error(`Failed to fetch scorecard: ${scorecardRes.status}`);
        }

        const scorecardData = await scorecardRes.json();
        const playerPointsMap = processMatch(scorecardData);

        const pointsArray = Object.entries(playerPointsMap).map(([playerId, data]) => ({
          externalId: playerId,
          points: data.points,
          stats: data.stats
        }));

        if (pointsArray.length === 0) {
          console.log(`[${new Date().toISOString()}] No player data for match ${match.matchId}, skipping...`);
          continue;
        }

        const updateRes = await fetch('http://localhost:3000/api/scores/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matchId: match.matchId, playerPoints: pointsArray })
        });

        if (!updateRes.ok) {
          throw new Error(`Failed to update scores: ${updateRes.status}`);
        }

        console.log(`[${new Date().toISOString()}] Updated scores for match ${match.matchId} (${pointsArray.length} players)`);

      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error processing match ${match.matchId}:`, err.message);
        continue;
      }
    }

    console.log(`[${new Date().toISOString()}] Completed processing all live matches`);

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching live matches:`, err.message);
  }
}

runPointsUpdater();

setInterval(runPointsUpdater, 300000);