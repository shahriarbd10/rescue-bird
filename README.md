# Rescue Bird

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Status-Active%20Development-2a35d6?style=for-the-badge" alt="Status" />
</p>

<p align="center">
  <b>Mobile-first emergency alert and rescue coordination platform for Bangladesh.</b><br />
  Built for fast incident reporting, team dispatch visibility, and role-based operations.
</p>

<p align="center">
  <img src="https://images.pexels.com/photos/6753483/pexels-photo-6753483.jpeg?cs=srgb&dl=pexels-pavel-danilyuk-6753483.jpg&fm=jpg" alt="Emergency response vehicle" width="31%" />
  <img src="https://images.pexels.com/photos/6753471/pexels-photo-6753471.jpeg?cs=srgb&dl=pexels-pavel-danilyuk-6753471.jpg&fm=jpg" alt="Rescue ambulance in field" width="31%" />
  <img src="https://images.pexels.com/photos/10439904/pexels-photo-10439904.jpeg?cs=srgb&dl=pexels-mukaddes-kocabasli-13054222-10439904.jpg&fm=jpg" alt="Emergency ambulance support" width="31%" />
</p>

## Why Rescue Bird?

- Rapid emergency alert creation with note, voice note, and location.
- Role-driven workflows for `admin`, `rescue_team`, `team_staff`, and `user`.
- Team matching by service areas plus geographic proximity.
- Live map visibility for users, teams, and admin.
- Messaging and audit trail for operational transparency.

## Tech Stack

<p>
  <img src="https://skillicons.dev/icons?i=nextjs,ts,mongodb,nodejs,css,vercel" alt="Tech stack icons" />
</p>

- Next.js App Router + TypeScript
- MongoDB (Atlas)
- JWT cookie auth
- Brevo SMTP (OTP + greeting email)
- Cloudinary (voice-note upload)
- Leaflet map integration

## Product Roles

1. `user`: send emergency alerts and communicate with teams.
2. `rescue_team`: manage coverage zones, respond to incidents, coordinate.
3. `team_staff`: assist team operations and messaging.
4. `admin`: audit users/messages/alert movements and platform oversight.

## Core Features

- OTP verification flow (`register -> verify -> login`)
- Live location sync and geolocation support
- Text-based location search with suggestion dropdown and lat/lng capture
- Voice recording + cloud upload for emergency context
- Role-based dashboard UI with mobile bottom navigation
- Team visibility markers on map (near/far indicators)

## Architecture Snapshot

```mermaid
flowchart LR
  U[User App] --> API[Next.js API Routes]
  T[Rescue Team/Staff] --> API
  A[Admin Console] --> API
  API --> DB[(MongoDB Atlas)]
  API --> SMTP[Brevo SMTP]
  API --> CDN[Cloudinary]
  API --> GEO[Location Search Provider]
```

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Quality Checks

```bash
npm run lint
npm run test
npm run build
```

## Environment Variables

Use `.env.local` and configure:

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `BREVO_HOST`, `BREVO_PORT`, `BREVO_USER`, `BREVO_PASS`
- `EMAIL_SENDER_EMAIL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`

## Similar Products (Research Inspiration)

- PulsePoint Respond: https://www.pulsepoint.org/
- GoodSAM: https://www.goodsamapp.org/
- Bangladesh emergency context (NES 999): https://www.youtube.com/watch?v=wYOseUIy6nA

## Repo Vision

Rescue Bird is designed as a practical, field-friendly safety network for dense urban response environments like Dhaka, with a UX optimized for mobile webview usage and rapid decision-making.
