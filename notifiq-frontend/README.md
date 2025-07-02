# NotifiQ - Local Development

This project is now set up for local development only.

## Backend (Django)
- Uses SQLite as the database (no cloud DB required).
- To run locally:
  1. Navigate to `notifiq-backend`.
  2. (Optional) Create a virtual environment and activate it.
  3. Install dependencies: `pip install -r requirements.txt`
  4. Run migrations: `python manage.py migrate`
  5. Start the server: `python manage.py runserver`

## Frontend (React + Vite)
- To run locally:
  1. Navigate to `notifiq-frontend`.
  2. Install dependencies: `npm install`
  3. Start the dev server: `npm run dev`

## Notes
- No cloud deployment (Railway, Vercel) is used or supported.
- The backend API runs at `http://localhost:8000` by default.
- The frontend runs at `http://localhost:5173` by default.
- Make sure both servers are running for full functionality.
