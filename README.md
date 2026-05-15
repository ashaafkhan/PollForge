# PollForge

Intelligent polling platform with real-time analytics, AI insights, conditional logic, and creator gamification.

## Features

- **Dynamic Poll Builder:** Conditional logic, multiple question types, and real-time preview.
- **Real-Time Analytics:** WebSocket-driven live dashboards, device tracking, and completion rates.
- **Poll Health Scoring:** Evaluate the quality of your poll (brevity, clarity, depth).
- **AI Insights:** Automated Anthropic Claude-powered summarization of poll results.
- **Results Theater:** Beautiful public results pages with QR code sharing and embed support.
- **Creator Gamification:** Earn score points, unlock badges (e.g., "Viral"), and receive real-time notifications on milestones.
## Setup (Stage 1)

### Prerequisites
- Node.js 18+

### Install
```bash
# Backend
cd server
npm install

# Frontend
cd ..\client
npm install
```

### Run
```bash
# Backend
cd server
npm run dev

# Frontend
cd ..\client
npm run dev
```

### Environment
Copy `.env.example` to `.env` and fill in values.
