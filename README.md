# CivicLens — AI-Powered Civic Issue Reporting

> Report potholes, broken streetlights, and other civic issues with live GPS, photo upload, and Gemini AI analysis.

![CivicLens](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase) ![Gemini](https://img.shields.io/badge/Google-Gemini_AI-blue?logo=google) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Live GPS capture** — high-accuracy geolocation via browser API
- **Photo upload** — camera or gallery, hosted on ImgBB (no Firebase Storage needed)
- **AI analysis** — Google Gemini 1.5 Flash analyzes the issue and starts a multi-turn chat
- **Real-time map** — Leaflet.js with dark CartoDB tiles, live Firestore sync
- **Anonymous identity** — persistent `CL-XXXXXX` user ID stored in localStorage
- **My Reports** — filter your own submissions by your anonymous ID
- **Delete reports** — remove your own reports with inline confirmation
- **Forward to PWD** — one-click WhatsApp share with full report details, map link, and photo

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Animations | Framer Motion |
| Database | Firebase Firestore |
| Image hosting | ImgBB API (free, no billing required) |
| AI | Google Gemini 1.5 Flash |
| Map | Leaflet.js + CartoDB dark tiles |
| Icons | Lucide React |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/devvrattrivedi/CivicLens.git
cd CivicLens
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in your keys in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps |
| `NEXT_PUBLIC_IMGBB_API_KEY` | [api.imgbb.com](https://api.imgbb.com/) — free account |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |

### 3. Set Firebase rules

**Firestore** → Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{report} {
      allow read, create, delete: if true;
    }
  }
}
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Gemini streaming endpoint
│   │   └── reports/route.ts    # Firestore read endpoint
│   ├── reports/page.tsx        # Live map + reports feed
│   ├── page.tsx                # Main dashboard
│   ├── layout.tsx
│   └── globals.css             # Design system
├── components/
│   ├── ReportForm.tsx          # GPS → photo → submit flow
│   ├── ChatInterface.tsx       # AI chat UI
│   ├── ReportsMap.tsx          # Leaflet map
│   ├── UploadAnimation.tsx     # Glowing upload ring animation
│   ├── GlassCard.tsx
│   ├── LoadingSpinner.tsx
│   └── StatusBadge.tsx
├── hooks/
│   ├── useGeolocation.ts
│   ├── useImgBBUpload.ts
│   ├── useChat.ts
│   └── useUserId.ts            # Persistent anonymous ID
└── lib/
    └── firebase.ts
```

---

## License

MIT © 2025 Dev Vrat Trivedi
