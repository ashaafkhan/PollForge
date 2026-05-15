# PollForge

> **Not just polls. Intelligence.**
> Intelligent polling platform with real-time analytics, AI-powered insights, conditional skip logic, and creator gamification.

## Live Demo

🔗 **[https://pollforge.vercel.app](https://pollforge.vercel.app)** *(deploy link placeholder)*

---

## Features

| Feature | Description |
|---|---|
| 🏗 **Poll Builder** | Multi-step wizard with drag-and-drop question reordering, conditional skip logic, and settings |
| ⚡ **Real-Time Analytics** | Socket.io-powered live dashboards — completion rates, time-series charts, device breakdown |
| 🤖 **AI Insights** | Anthropic Claude API analyzes responses and generates human-readable insights |
| 🎯 **Conditional Logic** | Show/hide questions based on previous answers |
| 🎭 **Results Theater** | Publish beautiful public results pages with animated charts |
| 📊 **Poll Health Score** | Composite score evaluating completion rate, skip rate, and response distribution |
| 🏆 **Creator Gamification** | Points, badges (Viral, First Poll, Data Wizard, Speed Runner), and a live score |
| 🔔 **Notification System** | Real-time bell notifications for response milestones via Socket.io |
| 📱 **QR & Embed** | QR code generation + iframe embed snippet for any poll |
| 🌙 **Dark Mode** | Toggle with localStorage persistence |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TailwindCSS, Recharts, Socket.io-client, React Hook Form + Zod |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB + Mongoose |
| Auth | JWT access tokens + refresh tokens (httpOnly cookie) |
| AI | Anthropic Claude API |
| Deployment | Railway (backend) + Vercel (frontend) + MongoDB Atlas |

---

## Architecture

```
client/                     # React 18 + Vite SPA
  src/
    pages/                  # Route-level components (lazy-loaded)
    components/             # Reusable UI (NotificationBell, QRModal, Skeleton…)
    context/                # AuthContext, ThemeContext
    hooks/                  # Custom hooks
    lib/                    # Axios instance with refresh interceptor

server/                     # Express.js API + Socket.io
  controllers/              # Business logic per resource
  models/                   # Mongoose schemas (User, Poll, Response, Notification)
  routes/                   # Express Router files
  middleware/               # auth, optionalAuth, error handler
  sockets/                  # pollSocket.js with debounced emit helper
  services/                 # DB connection, AI insights service
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB URI (local or Atlas)
- Anthropic API Key *(optional — for AI insights)*

### Installation

```bash
# Clone
git clone https://github.com/yourname/pollforge
cd pollforge

# Backend
cd server
npm install
cp ../.env.example .env   # Fill in values
npm run dev

# Frontend (new terminal)
cd client
npm install
cp ../.env.example .env
npm run dev
```

### Environment Variables

```env
# server/.env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
ANTHROPIC_API_KEY=sk-ant-...   # optional

# client/.env
VITE_API_URL=http://localhost:5000
```

---

## API Reference

### Auth  `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register |
| POST | `/login` | — | Login |
| POST | `/refresh` | — | Refresh access token |
| POST | `/logout` | — | Logout |
| GET | `/me` | ✅ | Current user |

### Polls  `/api/polls`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | ✅ | Create poll (draft) |
| GET | `/my` | ✅ | Creator's polls |
| GET | `/:slug` | — | Public poll |
| PUT | `/:id` | ✅ | Update poll |
| DELETE | `/:id` | ✅ | Delete poll |
| PATCH | `/:id/activate` | ✅ | Activate draft |
| PATCH | `/:id/publish` | ✅ | Publish results |
| GET | `/:id/analytics` | Optional | Analytics |
| GET | `/:id/qr` | — | QR code PNG |

### Responses  `/api/responses`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Optional | Submit response |
| GET | `/check/:pollId` | Optional | Has responded? |

### Notifications  `/api/notifications`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | List notifications |
| PATCH | `/:id/read` | ✅ | Mark as read |

---

## Security

- **Rate limiting**: 100 req/15min globally; 10 submissions/hr per IP for responses
- **JWT**: Access token in memory; refresh token in `httpOnly` cookie
- **IP hashing**: SHA-256 hashed — never stored raw
- **Helmet.js**: Security headers
- **CORS**: Restricted to `CLIENT_URL`

---

*PollForge — Built to win. 🏆*
