# Watchly

Watchly is a full-stack monorepo web application for discovering, tracking, rating, and discussing movies.

## Stack

- Frontend: Vue 3, Vite, Vue Router, Pinia, TailwindCSS, Axios, GSAP
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, dotenv
- External API: TMDB

## Monorepo structure

```text
Watchly/
  backend/
  frontend/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure backend env:

- Copy `backend/.env.example` to `backend/.env`
- Fill:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `TMDB_API_KEY`

3. Configure frontend env:

- Copy `frontend/.env.example` to `frontend/.env`

Frontend env values:

- `VITE_API_BASE_URL`
- `VITE_TMDB_IMAGE_BASE` (optional)

## Run

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

## Environment variables

Backend:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/watchly
JWT_SECRET=replace_with_a_long_random_secret
TMDB_API_KEY=replace_with_your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

## Deploy

Recommended free setup:

- Frontend on Vercel
- Backend on Render
- Database on MongoDB Atlas

### 1. MongoDB Atlas

- Create a free cluster
- Create a database user
- Add network access for your backend host
- Copy the connection string into `MONGO_URI`

### 2. Backend on Render

- Create a new `Web Service`
- Connect your GitHub repository
- Set `Root Directory` to `backend`
- Set `Build Command` to `npm install`
- Set `Start Command` to `npm start`

Render environment variables:

```env
MONGO_URI=your_atlas_connection_string
JWT_SECRET=your_long_random_secret
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

Health check URL:

```text
https://your-render-service.onrender.com/api/health
```

### 3. Frontend on Vercel

- Create a new project from the same repository
- Set `Root Directory` to `frontend`
- Keep the Vite defaults

Vercel environment variables:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
VITE_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

### 4. Final checks

- Register a new account on production
- Verify login/logout
- Verify movies load correctly
- Verify friend requests and notifications work
- Verify profile updates persist

## API routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Movies

- `GET /api/movies/trending`
- `GET /api/movies/popular`
- `GET /api/movies/top-rated`
- `GET /api/movies/upcoming`
- `GET /api/movies/:id`
- `GET /api/movies/search?q=...`

### Reviews

- `POST /api/reviews`
- `GET /api/reviews/movie/:id`
- `PUT /api/reviews/:id`
- `DELETE /api/reviews/:id`
- `POST /api/reviews/:id/like`
- `POST /api/reviews/:id/comment`

### Users

- `GET /api/users/:id`
- `PUT /api/users/:id`
- `GET /api/users/:id/watchlist`
- `POST /api/users/watchlist`
- `DELETE /api/users/watchlist/:movieId`
- `POST /api/users/watched`
- `POST /api/users/:id/follow`
- `GET /api/users/feed/activity`

### Recommendations

- `GET /api/recommendations`
