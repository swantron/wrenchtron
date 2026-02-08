# Wrenchtron

Vehicle maintenance tracker built with Next.js 15 (static export) and Firebase.

## Stack

- **Frontend**: Next.js 15 (App Router, static export) + Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore, Cloud Storage)
- **PWA**: Service worker via @serwist/next, offline Firestore persistence
- **Hosting**: Firebase Hosting (free tier)

## Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Google Auth, Firestore, and Cloud Storage
3. Copy `.env.local.example` to `.env.local` and fill in your Firebase config
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`
5. Deploy Storage rules: `firebase deploy --only storage`

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build          # generates static site in out/
firebase deploy        # deploys to Firebase Hosting
```

## Project Structure

```
src/
  app/                 # Next.js pages (static export, all client-rendered)
  components/          # React components (auth, layout, vehicles, maintenance, dashboard, ui)
  hooks/               # React hooks wrapping Firebase SDK calls
  lib/firebase/        # Pure Firebase SDK functions (not React-aware)
  lib/image/           # Client-side image compression
  types/               # TypeScript type definitions
```

## Routes

| Path                        | Description              |
|-----------------------------|--------------------------|
| `/`                         | Dashboard                |
| `/login`                    | Google sign-in           |
| `/vehicles`                 | Vehicle list             |
| `/vehicles/new`             | Add vehicle              |
| `/vehicles/detail?id=xxx`   | Vehicle detail + history |
| `/vehicles/edit?id=xxx`     | Edit vehicle             |
| `/maintenance/new?vehicleId=xxx` | Log maintenance     |
