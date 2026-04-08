# Umpire's Call - Fantasy Cricket App

A full-stack fantasy cricket web application built with Next.js 14, MongoDB, Firebase Auth, and Socket.io for real-time updates. Play fantasy cricket with your friends for free!

## Features

- **User Authentication** - Secure login with Firebase Auth (Google OAuth & Email/Password)
- **Contest Management** - Create private contests with invite codes for friends
- **Team Selection** - Build your dream team with 100 credit budget
- **Live Scoring** - Real-time fantasy points updated from Cricbuzz API
- **Leaderboards** - Ranked participant lists with live updates
- **Admin Panel** - Manage match scorecard URLs for live scoring

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** Firebase Authentication
- **Real-time:** Socket.io
- **State Management:** Zustand

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your MongoDB URI, Firebase credentials, and other config.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Initial Setup (First Time)

1. **Seed matches:**
   ```bash
   npm run seed
   ```

2. **Seed players with external IDs:**
   ```bash
   npm run seed:players
   ```

3. **Migrate existing team player IDs** (if you have old teams):
   ```bash
   npx tsx src/lib/migrate-players.ts
   ```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── admin/         # Admin pages (match management)
│   │   ├── dashboard/    # Main dashboard
│   │   ├── contests/      # Contest browsing
│   │   ├── create-contest/# Create new contest
│   │   ├── my-team/       # Team selection
│   │   └── leaderboard/   # Contest leaderboards
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── live-scoring.ts    # Points calculation service
│   ├── match-status.ts    # Match timing logic
│   └── migrate-players.ts  # Player ID migration
├── models/                # MongoDB models
├── hooks/                 # Custom React hooks
├── store/                # Zustand stores
└── types/                # TypeScript types
```

---

## API Endpoints

### Matches API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | List all matches (supports `?status=upcoming\|live\|completed`) |
| POST | `/api/matches` | Create a new match |
| GET | `/api/matches/live` | Get all live matches with scorecard URLs |
| POST | `/api/matches/update-scorecard` | Set scorecard URL for a match |

#### Update Scorecard Payload
```json
{
  "matchId": "MONGODB_MATCH_ID",
  "scorecardUrl": "https://www.cricbuzz.com/api/mcenter/scorecard/149684",
  "cricbuzzId": "149684"
}
```

---

### Contests API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contests` | List all contests (supports `?matchId=xxx&inviteCode=xxx`) |
| POST | `/api/contests` | Create a new contest |
| GET | `/api/contests/[id]` | Get contest details |
| PUT | `/api/contests/[id]` | Update contest |
| DELETE | `/api/contests/[id]` | Delete contest |
| POST | `/api/contests/[id]/join` | Join a contest |

#### Create Contest Payload
```json
{
  "name": "Private Contest",
  "description": "Playing with friends",
  "matchId": "MONGODB_MATCH_ID",
  "entryFee": 0,
  "maxParticipants": 10,
  "creatorId": "MONGODB_USER_ID",
  "startTime": "2026-04-03T19:30:00Z",
  "endTime": "2026-04-03T23:30:00Z"
}
```

#### Join Contest Payload
```json
{
  "userId": "MONGODB_USER_ID"
}
```

---

### Teams API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List teams (supports `?userId=xxx&contestId=xxx`) |
| POST | `/api/teams` | Create a team |
| GET | `/api/teams/[id]` | Get team details |
| PUT | `/api/teams/[id]` | Update team |
| DELETE | `/api/teams/[id]` | Delete team |

#### Create/Update Team Payload
```json
{
  "userId": "MONGODB_USER_ID",
  "contestId": "MONGODB_CONTEST_ID",
  "name": "My Team",
  "players": [
    { "playerId": "MONGODB_PLAYER_ID", "name": "Ruturaj Gaikwad", "role": "batsman", "creditCost": 9 },
    ...
  ],
  "totalCredits": 96.5,
  "captainId": "MONGODB_PLAYER_ID",
  "viceCaptainId": "MONGODB_PLAYER_ID"
}
```

---

### Players API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players` | List players (supports `?role=xxx&team=xxx`) |
| POST | `/api/players` | Bulk create players |

---

### Scores API (Live Scoring)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scores` | Get scores (supports `?matchId=xxx` OR `?contestId=xxx`) |
| GET | `/api/scores/[contestId]` | Get contest scores with leaderboard |
| POST | `/api/scores/update` | Update player points from external API |

#### Update Scores Payload
```json
{
  "matchId": "MONGODB_MATCH_ID",
  "playerPoints": [
    {
      "externalId": "11813",
      "points": 46,
      "stats": {
        "runs": 28,
        "balls": 22,
        "fours": 2,
        "sixes": 0,
        "strikeRate": 127.27,
        "wickets": 0,
        "overs": 0,
        "maiden": 0,
        "economy": 0,
        "catches": 1,
        "runOuts": 1
      }
    },
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matchId": "...",
    "playerScores": [...],
    "leaderboard": [
      { "_id": "team_id", "teamName": "My Team", "score": 206.5, "rank": 1 },
      ...
    ]
  }
}
```

---

### Users API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |

---

## Live Scoring Workflow

### Step 1: Set Scorecard URL for a Match

Before a match starts (or during live), set the Cricbuzz scorecard API URL:

```bash
curl -X POST http://localhost:3000/api/matches/update-scorecard \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "MONGODB_MATCH_ID",
    "scorecardUrl": "https://www.cricbuzz.com/api/mcenter/scorecard/149684",
    "cricbuzzId": "149684"
  }'
```

Or use the Admin Panel at: `http://localhost:3000/admin/matches`

### Step 2: Run Points Runner

Start the points runner script to fetch live data every 5 minutes:

```bash
node points-runner.js
```

The runner will:
1. Fetch all live matches from `/api/matches/live`
2. For each match, fetch scorecard data from the scorecardUrl
3. Calculate fantasy points using the points engine
4. Send points to `/api/scores/update`
5. Team scores are automatically calculated (Captain: 2x, Vice-Captain: 1.5x)

### Step 2B: Production Auto-Calculate (Vercel Cron)

In production, score calculation runs in the background every 3 minutes via Vercel Cron.

1. Ensure `vercel.json` includes:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-calculate-live",
      "schedule": "*/3 * * * *"
    }
  ]
}
```

2. Add environment variable in Vercel Project Settings:

```bash
CRON_SECRET=eec35f796c90f1353da6f7cdefca512e55a376ae37ee2474f1fec11fa7088afc
```

3. Route auth behavior:
The cron route checks the `Authorization` header as:

```text
Authorization: Bearer <CRON_SECRET>
```

If `CRON_SECRET` is set, unauthorized requests are rejected with `401`.

4. Optional local/manual test:

```bash
curl -X GET http://localhost:3000/api/cron/auto-calculate-live \
  -H "Authorization: Bearer eec35f796c90f1353da6f7cdefca512e55a376ae37ee2474f1fec11fa7088afc"
```

### Step 3: View Leaderboard

```bash
curl "http://localhost:3000/api/scores?contestId=CONTEST_ID"
```

---

## Points Calculation

### Batting Points
- Runs: 1 point per run
- Fours: +4 points
- Sixes: +6 points
- Half-century (50+): +8 points
- Century (100+): +16 points
- Duck (0 runs): -2 points
- Strike Rate bonuses (min 10 balls):
  - >170: +6 | >150: +4 | >130: +2
  - <70: -2 | <60: -4 | <50: -6

### Bowling Points
- Wickets: 30 points per wicket
- 3-wicket haul: +4 points
- 4-wicket haul: +8 points
- 5-wicket haul: +12 points
- Maiden overs: +12 points
- Economy bonuses (min 2 overs):
  - <5: +6 | <6: +4 | <=7: +2
  - >=12: -6 | >=11: -4 | >=10: -2

### Fielding Points
- Catch/Run-out/Stumping: 8 points each

### Team Selection Multipliers
- Captain: 2x points
- Vice-Captain: 1.5x points
- Others: 1x points

---

## Match Status Logic

| Time Relative to Match | Status |
|-----------------------|--------|
| Before match time | `upcoming` |
| Match time to +5 hours | `live` |
| After +5 hours | `completed` |

Status is automatically calculated when fetching from `/api/matches/live`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run seed` | Seed IPL 2026 matches |
| `npm run seed:players` | Seed players with external IDs |
| `npx tsx src/lib/migrate-players.ts` | Migrate team player IDs |

---

## License

MIT