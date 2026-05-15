# PollForge

<div align="center">
  <img src="client/public/pollforge-logo.png" alt="PollForge Logo" width="120" />
</div>

> **Empowering Collective Decisions.**
> A modern, professional polling platform with real-time analytics, conditional skip logic, and robust creator tools.

## 🌐 Live Application

**Live Link:** [https://pollforge.ashaaf.in](https://pollforge.ashaaf.in)
---

## 📖 Project Overview

PollForge is a full-stack, enterprise-grade polling platform built to facilitate seamless data collection and analysis. It empowers creators to build dynamic surveys with advanced logic, share them effortlessly, and view results in real-time. Designed with a clean, responsive UI and a robust scalable backend, PollForge handles everything from simple single-question polls to complex, conditional surveys.

### Key Highlights
- **Real-Time Data Sync:** Powered by Socket.io, analytics dashboards update instantly as responses flow in—no page reloads required.
- **Advanced Survey Logic:** Conditional branching allows creators to build intelligent surveys that adapt to respondent answers.
- **Secure Authentication:** Integrated with Firebase Authentication (Google OAuth) for a frictionless, secure sign-in experience.
- **Dynamic Theming:** Fully responsive, modern design with a seamless dark/light mode toggle built using CSS variables.
- **Creator Gamification:** Users earn reputation points and badges based on their engagement and the success of their polls.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏗 **Interactive Poll Builder** | Multi-step wizard with drag-and-drop question reordering, comprehensive settings, and robust validation. |
| ⚡ **Real-Time Analytics** | Live dashboards showing completion rates, time-series charts, and device breakdowns via WebSockets. |
| 🎯 **Conditional Skip Logic** | Dynamically show or hide questions based on previous answers to create personalized survey flows. |
| 🎭 **Professional Results** | Publish beautiful public results pages with animated, interactive charts. |
| 🛡️ **Secure Access Control** | Option to require authentication or allow anonymous responses with IP-based rate limiting. |
| 🏆 **Creator Profile** | Track your global creator score, view earned badges, and manage your poll portfolio. |
| 📱 **Multi-Channel Sharing** | Instant QR code generation and quick-copy links for effortless sharing. |
| 🌙 **Theme Support** | Fluid Dark/Light mode toggle that respects user preference and persists across sessions. |

---

## 🛠 Tech Stack

**Frontend Ecosystem**
- **Framework:** React 18 + Vite
- **Styling:** TailwindCSS + CSS Variables for theming
- **Data Visualization:** Recharts
- **Real-time:** Socket.io-client
- **Form Management & Validation:** React Hook Form + Zod
- **Routing:** React Router DOM

**Backend Architecture**
- **Server:** Node.js, Express.js
- **Database:** MongoDB + Mongoose (hosted on Atlas)
- **Real-time:** Socket.io
- **Authentication:** Firebase Admin SDK (verifying Google OAuth tokens)
- **Security:** Helmet.js, express-rate-limit

**Deployment Strategy**
- **Frontend:** Vercel (Optimized SPA routing via `vercel.json`)
- **Backend:** Render
- **Database:** MongoDB Atlas (IP whitelisted for Render)

---

## 🏗 Architecture & Code Structure

The repository is structured as a monorepo containing both the React frontend and the Express backend.

```text
pollforge/
├── client/                     # React 18 + Vite SPA
│   ├── public/                 # Static assets (Favicon, Logo)
│   ├── src/
│   │   ├── pages/              # Route-level components (Landing, Dashboard, Builder, etc.)
│   │   ├── components/         # Reusable UI elements (ResultsDisplay, Skeleton, QRModal)
│   │   ├── context/            # Global state (AuthContext, ThemeContext)
│   │   └── lib/                # API client (Axios) and Firebase initialization
│   └── vercel.json             # Vercel configuration for SPA routing
│
├── server/                     # Node.js + Express API
│   ├── controllers/            # Business logic (authController, pollController)
│   ├── models/                 # Mongoose Data Models (User, Poll, Response)
│   ├── routes/                 # API endpoint definitions
│   ├── middleware/             # Custom middleware (auth checking, error handling)
│   └── index.js                # Server entry point and Socket.io setup
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- MongoDB URI (local or Atlas cluster)
- Firebase Project (for Google OAuth credentials)

### 1. Clone the Repository
```bash
git clone https://github.com/ashaafkhan/PollForge
cd PollForge
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT='{ "type": "service_account", ... }' # Firebase Admin SDK JSON
```
Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```
Start the development server:
```bash
npm run dev
```

---

## 🔒 Security Measures

- **Authentication:** Relies on industry-standard Firebase Auth and secure JWT token exchange.
- **Rate Limiting:** Protects endpoints from abuse (e.g., 100 req/15min globally, strict limits on response submissions).
- **Data Validation:** Strict Zod schemas on the frontend and Mongoose validation on the backend to prevent malicious payloads.
- **Secure Headers:** Implementation of `helmet` middleware for HTTP header security.
- **CORS:** Strictly configured to only allow requests from the designated `CLIENT_URL`.
