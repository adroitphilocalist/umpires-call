# Umpire's Call - Fantasy Cricket App Specification

## 1. Project Overview

**Project Name:** Umpire's Call  
**Project Type:** Full-stack Fantasy Cricket Web Application  
**Core Functionality:** A real-time fantasy cricket platform where users create virtual teams, join contests, and compete based on real player performances.  
**Target Users:** Cricket enthusiasts who want to engage more deeply with the sport through fantasy gaming.

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Icons:** Lucide React

### Backend
- **Framework:** Next.js API Routes
- **Database:** MongoDB Atlas (via Mongoose)
- **Authentication:** Firebase Auth
- **Real-time:** Socket.io

## 3. UI/UX Specification

### Color Palette
- **Primary:** `#1a472a` (Deep Forest Green)
- **Secondary:** `#2d5a3d` (Lighter Green)
- **Accent:** `#d4af37` (Cricket Gold)
- **Background:** `#0a0f0d` (Near Black)
- **Surface:** `#141c16` (Dark Green-Black)
- **Surface Light:** `#1e2a22` (Elevated Surface)
- **Text Primary:** `#f5f5dc` (Cream White)
- **Text Secondary:** `#a8b5a0` (Muted Green)
- **Error:** `#dc3545`
- **Success:** `#28a745`

### Typography
- **Headings:** "Playfair Display", serif (fallback: Georgia)
- **Body:** "Inter", sans-serif (fallback: system-ui)
- **Monospace:** "JetBrains Mono" (for scores/stats)

### Layout Structure
- **Mobile:** Single column, bottom navigation
- **Tablet:** Two-column where appropriate
- **Desktop:** Max-width 1440px, centered

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 4. Pages & Routes

### Public Routes
1. **Landing Page** (`/`)
   - Hero section with app branding
   - Feature highlights
   - Call-to-action buttons (Login/Register)

2. **Login** (`/login`)
   - Firebase Google OAuth
   - Email/Password login
   - Link to registration

3. **Register** (`/register`)
   - Firebase Google OAuth
   - Email/Password registration
   - Username selection

### Protected Routes (Dashboard)
4. **Dashboard** (`/dashboard`)
   - Active contests list
   - Upcoming matches
   - Quick stats (contests joined, rank)
   - Recent activity

5. **Create Contest** (`/create-contest`)
   - Contest name and description
   - Entry fee selection
   - Maximum participants
   - Player selection criteria (all teams, specific teams)

6. **Contest Details** (`/contest/[id]`)
   - Contest info and rules
   - Participant list
   - Start/End time
   - Join button (if not joined)
   - Link to team selection

7. **Team Selection** (`/my-team/[contestId]`)
   - Player pool with stats
   - Position selection (Batsman, Bowler, All-rounder, Wicket-keeper)
   - Budget constraint (100 credits)
   - Save team button

8. **Leaderboard** (`/leaderboard/[contestId]`)
   - Ranked participant list
   - Real-time score updates
   - Current user's highlight

9. **Profile** (`/profile`)
   - User info (from Firebase)
   - Contest history
   - Statistics (total contests, wins, avg rank)

## 5. API Endpoints

### Authentication
- `GET /api/auth/[...nextauth]` - NextAuth.js handler

### Matches
- `GET /api/matches` - List all matches
- `GET /api/matches/[id]` - Get match details

### Contests
- `GET /api/contests` - List all contests
- `POST /api/contests` - Create new contest
- `GET /api/contests/[id]` - Get contest details
- `PUT /api/contests/[id]` - Update contest
- `DELETE /api/contests/[id]` - Delete contest
- `POST /api/contests/[id]/join` - Join a contest

### Teams
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create team
- `GET /api/teams/[id]` - Get team details
- `PUT /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

### Scores
- `GET /api/scores` - Get live scores
- `POST /api/scores` - Update scores (admin)

## 6. Database Models

### User
```typescript
{
  _id: ObjectId,
  firebaseUid: string,
  email: string,
  displayName: string,
  username: string,
  avatar?: string,
  credits: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Match
```typescript
{
  _id: ObjectId,
  team1: { name: string, shortName: string },
  team2: { name: string, shortName: string },
  venue: string,
  date: Date,
  status: 'upcoming' | 'live' | 'completed',
  format: 'T20' | 'ODI' | 'Test',
  createdAt: Date
}
```

### Contest
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  matchId: ObjectId,
  entryFee: number,
  maxParticipants: number,
  prizePool: number,
  creatorId: ObjectId,
  participants: ObjectId[],
  status: 'open' | 'filled' | 'completed',
  startTime: Date,
  endTime: Date,
  createdAt: Date
}
```

### Team
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  contestId: ObjectId,
  name: string,
  players: [{
    playerId: ObjectId,
    role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper',
    creditCost: number
  }],
  totalCredits: number,
  captainId: ObjectId,
  viceCaptainId: ObjectId,
  score: number,
  rank: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Player
```typescript
{
  _id: ObjectId,
  name: string,
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper',
  team: string,
  creditValue: number,
  image?: string,
  stats: {
    matches: number,
    runs?: number,
    wickets?: number,
    average?: number,
    strikeRate?: number
  }
}
```

## 7. Real-time Features (Socket.io)

### Events
- `match:scoreUpdate` - Live score updates
- `contest:participantJoined` - New participant
- `team:rankUpdate` - Rank changes
- `leaderboard:refresh` - Full leaderboard update

## 8. Component Library

### UI Components
- Button (primary, secondary, ghost variants)
- Input (text, number, email, password)
- Card (contest card, match card, player card)
- Modal
- Dropdown
- Avatar
- Badge (status indicators)
- Loader/Spinner

### Feature Components
- **Auth:** LoginForm, RegisterForm, OAuthButtons
- **Contest:** ContestCard, ContestList, ContestDetails
- **Team:** PlayerCard, TeamBuilder, PositionSelector
- **Live:** LiveScore, ScoreCard, WicketAlert

## 9. Acceptance Criteria

### Authentication
- [ ] Users can register with Google OAuth
- [ ] Users can login with email/password
- [ ] Protected routes redirect to login
- [ ] User session persists

### Contest Management
- [ ] Users can create contests with custom settings
- [ ] Users can browse available contests
- [ ] Users can join contests (if slots available)
- [ ] Contest shows participant count

### Team Selection
- [ ] Users can select players within budget
- [ ] Users must select valid player count per role
- [ ] Users can designate captain/vice-captain
- [ ] Team can be saved and edited

### Live Features
- [ ] Scores update in real-time
- [ ] Leaderboard reflects current rankings
- [ ] Socket connection handles reconnection

### Performance
- [ ] Page loads under 3 seconds
- [ ] API responses under 500ms
- [ ] Real-time updates within 1 second

## 10. Security

- Firebase Auth tokens validated on each request
- API routes protected with middleware
- Input validation on all forms
- MongoDB injection prevention
- CORS configured for allowed origins
