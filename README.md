# Umpire's Call - Fantasy Cricket App

A full-stack fantasy cricket web application built with Next.js 14, MongoDB, Firebase Auth, and Socket.io for real-time updates.

## Features

- **User Authentication** - Secure login with Firebase Auth (Google OAuth & Email/Password)
- **Contest Management** - Create and join fantasy cricket contests
- **Team Selection** - Build your dream team with budget constraints
- **Real-time Scoring** - Live score updates via Socket.io
- **Leaderboards** - Ranked participant lists with live updates

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** Firebase Authentication
- **Real-time:** Socket.io
- **State Management:** Zustand

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

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Auth pages (login, register)
│   ├── (dashboard)/  # Protected dashboard pages
│   └── api/          # API routes
├── components/       # React components
│   ├── ui/           # Reusable UI components
│   ├── auth/         # Auth-related components
│   ├── contest/      # Contest components
│   ├── team/         # Team selection components
│   └── live/         # Live scoring components
├── lib/              # Utility libraries
├── models/           # MongoDB models
├── hooks/            # Custom React hooks
├── store/            # Zustand stores
└── types/            # TypeScript types
```

## API Endpoints

- `GET /api/matches` - List matches
- `GET/POST /api/contests` - Manage contests
- `GET/POST /api/teams` - Manage teams
- `GET /api/scores` - Get live scores

## License

MIT
