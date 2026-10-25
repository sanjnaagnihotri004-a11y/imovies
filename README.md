
# iMovies

Movie ticket booking and cinema management system (MERN stack).

## Features
- Register and login (JWT), user and admin roles
- Browse and filter movies, theatres and shows
- Seat selection with 5-minute seat locking (no double booking)
- Razorpay payment (test mode) with server-side signature check
- Booking history and cancellation (2-hour rule)
- Favorites, ratings and reviews
- Admin dashboard: movies, theatres, shows, bookings, refunds, users, reviews, revenue stats

## Tech
MongoDB Atlas, Express, React (Vite), Node.js

## Run locally
1. `cd server`, copy `.env.example` to `.env`, fill in values, then `npm install` and `npm run dev`
2. `cd client`, create `.env` with `VITE_API_URL=http://localhost:8000/api`, then `npm install` and `npm run dev`

## Live demo
- Frontend:https://imovies-pi.vercel.app
- Backend:https://imovies-06qa.onrender.com

## Notes
- Booking confirmation email works locally (Gmail). On Render's free tier, outgoing email ports are blocked, so the live site shows confirmations in-app. A production setup would use an email API such as Resend with a verified domain.
- Payments use Razorpay test mode only.