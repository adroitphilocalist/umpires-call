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

    // Batting
    const batsmen = innings.batTeamDetails.batsmenData;
    Object.values(batsmen).forEach(b => {
      const id = b.batId;

      if (!players[id]) {
        players[id] = { name: b.batName, points: 0 };
      }

      players[id].points += battingPoints(b);
    });

    // Bowling
    const bowlers = innings.bowlTeamDetails.bowlersData;
    Object.values(bowlers).forEach(bw => {
      const id = bw.bowlerId;

      if (!players[id]) {
        players[id] = { name: bw.bowlName, points: 0 };
      }

      players[id].points += bowlingPoints(bw);
    });

  });

  // Fielding
  Object.keys(players).forEach(id => {
    players[id].points += fieldingPoints(parseInt(id), scorecards);
  });

  return players;
}

setInterval(async () => {
  const res = await fetch("https://www.cricbuzz.com/api/mcenter/scorecard/149684");
  const data = await res.json();

  const points = processMatch(data);

  console.log(points); // or store in DB

}, 5000);