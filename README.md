# 180-Day Productivity Tracker (Full Stack)

Personal full-stack study tracker for a disciplined 180-day journey.

## Tech Stack
- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: Express.js (MVC style)
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt

## Folder Structure
```text
Codex/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
  frontend/
    src/
      app/
        (auth)/login
        (auth)/signup
        dashboard
        days/[dayNumber]
      components/
      lib/
```

## Implemented Features
- Signup, login, logout-ready JWT auth
- Secure backend routes with JWT middleware
- Auto-generate Day 1 to Day 180 records on signup
- Real calendar-based active-day logic:
  - Formula: `(today - tracker_start_date) + 1`
  - Start date controlled by `TRACKER_START_DATE` (default: `2026-02-14`)
- Dashboard summary:
  - Completed days
  - Remaining days
  - Total hours
  - Progress percent
- Day access rules:
  - Only current day is clickable/editable
  - Past days are read-only
  - Future days are locked
  - Backend blocks direct URL access to future days
- 180 day blocks with current/past/future visual states
- Day detail editing:
  - Category checkboxes (DSA, Backend, College, English, Blockchain)
  - Notes
  - Daily reflection
  - Weekly reflection
  - Revision mark
  - Manual hours
- Persistent timer API:
  - Start / Pause / Stop
  - Running timer survives refresh because state is kept in MongoDB
  - Stop saves timer seconds to that day
  - Backend allows timer save only for current day
- Analytics section:
  - Weekly execution hours graph
  - Category execution breakdown
- Input validation and centralized error handling
- CORS config for frontend/backend split deploy

## Environment Variables
### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
TRACKER_START_DATE=2026-02-14
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Local Setup
1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

3. Start backend:
```bash
cd ../backend
npm run dev
```

4. Start frontend:
```bash
cd ../frontend
npm run dev
```

5. Open:
- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/api/health

## REST API Endpoints
### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Tracker
- `GET /api/tracker/dashboard`
- `GET /api/tracker/analytics`
- `GET /api/tracker/days/:dayNumber`
- `PUT /api/tracker/days/:dayNumber`

### Timer
- `GET /api/timer/current`
- `POST /api/timer/start`
- `POST /api/timer/pause`
- `POST /api/timer/stop`

## Deployment Notes
### Backend on Render
1. Create a new Web Service from `backend` directory.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add env vars: `MONGO_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`, `TRACKER_START_DATE`.
5. Use your Vercel frontend URL in `FRONTEND_URL`.

### Frontend on Vercel
1. Import `frontend` directory as project.
2. Add env var `NEXT_PUBLIC_API_URL` with your Render backend API URL.
3. Deploy.

## Important Persistence Notes
- Core tracker data and timer state are persisted in MongoDB.
- No core tracking data is stored in localStorage.
- Refresh/close does not erase day records or timer state.

## Next Recommended Steps
1. Add refresh-token + httpOnly cookie auth for stronger production security.
2. Add unit/integration tests (Jest + Supertest).
3. Add charts and weekly analytics views.
