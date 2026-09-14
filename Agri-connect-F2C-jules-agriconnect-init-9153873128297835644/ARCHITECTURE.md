# Architecture

## Frontend
- Configured using Vite, React and TypeScript.
- Planned structure separates features by role (Consumer, Farmer, Admin).

## Backend
- Built on FastAPI.
- Routes are organized internally by resource domain (Users, Products, AI, IVR).
- Database communication defaults to abstraction over Supabase (PostgreSQL).

## AI and External Services
- `ai_service.py` provides semantic extraction and intelligence fallbacks.
- `ivr_service.py` handles mock Twilio webhooks to handle voice requests for digitally excluded users.