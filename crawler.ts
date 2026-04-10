type OverData = {
  overs: number;
  bowlIds: number[];
  bowlNames: string[];
  ovrSummary: string;
};

type RawOverData = {
  overs: number;
  bowlIds: number[];
  bowlNames: string[];
  ovrSummary: string;
};
type ApiResponse = {
  paginatedData: RawOverData[];
  nextPaginationURL: string;
};
const BASE_URL = "https://www.cricbuzz.com";

// Count dot balls from ovrSummary
function countDotBalls(summary: string): number {
  let count = 0;

  // Split by space and iterate once
  const balls = summary.trim().split(/\s+/);

  for (const ball of balls) {
    if (ball === "0") count++;
  }

  return count;
}

async function fetchInningsData(matchId: string, innings: number): Promise<OverData[]> {
  let url = `${BASE_URL}/api/mcenter/over-by-over/${matchId}/${innings}`;
  const allOvers: OverData[] = [];

  const seenOvers = new Set<string>(); // ✅ NEW

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed API: ${url}`);

    const data: ApiResponse = await res.json();

    for (const over of data.paginatedData) {
      const key = `${innings}-${over.overs}`; // ✅ UNIQUE KEY

      if (seenOvers.has(key)) continue; // ❌ skip duplicates

      seenOvers.add(key);

      allOvers.push({
        overs: over.overs,
        bowlIds: over.bowlIds,
        bowlNames: over.bowlNames,
        ovrSummary: over.ovrSummary
      });
    }

    if (!data.nextPaginationURL) break;

    url = BASE_URL + data.nextPaginationURL;
  }
console.log(allOvers)
  return allOvers;
}

// Main function
export async function getBowlerDotBalls(matchId: string) {
  const bowlerDotMap = new Map<number, number>();

  // Fetch both innings sequentially
  for (let innings = 1; innings <= 2; innings++) {
    const overs = await fetchInningsData(matchId, innings);

    for (const over of overs) {
      if (!over.bowlIds || over.bowlIds.length === 0) continue;

      const bowlerId = over.bowlIds[0];
      const dotBalls = countDotBalls(over.ovrSummary || "");

      bowlerDotMap.set(
        bowlerId,
        (bowlerDotMap.get(bowlerId) || 0) + dotBalls
      );
    }
  }

  // Convert Map → Object (optional)
  const result: Record<number, number> = {};
  for (const [bowlerId, dots] of bowlerDotMap.entries()) {
    result[bowlerId] = dots;
  }

  return result;
}

(async () => {
  const matchId = "149721";

  const result = await getBowlerDotBalls(matchId);
  console.log("ID based:", result);

  // // 👇 THIS WAS MISSING
  // const namedResult = mapBowlerIdToName(result);

  // console.log("Name based:", namedResult);
})();


import fs from "fs";

type Player = {
  id: string;
  name: string;
};

// Load JSON safely
const players: Player[] = JSON.parse(
  fs.readFileSync("./cleaned_players.json", "utf-8")
);

// Build id → name map (once)
function buildPlayerMap(): Map<number, string> {
  const map = new Map<number, string>();

  for (const p of players) {
    map.set(Number(p.id), p.name);
  }

  return map;
}

// // Convert bowlerId → dot balls into name → dot balls
// export function mapBowlerIdToName(dotBallData: Record<number, number>) {
//   const playerMap = buildPlayerMap();

//   const result: Record<string, number> = {};

//   for (const bowlerId in dotBallData) {
//     const id = Number(bowlerId);

//     const name = playerMap.get(id) || `Unknown(${id})`;

//     result[name] = dotBallData[id];
//   }

//   console.log(result);
// }