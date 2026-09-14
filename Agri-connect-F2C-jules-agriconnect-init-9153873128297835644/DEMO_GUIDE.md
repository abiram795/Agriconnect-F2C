# Demo Guide

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Access docs at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Running the Mock Demo
1. Search product functionality triggers `mock_natural_language_search`.
2. Pricing relies on AI pricing estimate endpoint at `/api/ai/price`.
3. Test Voice IVR endpoint at `/api/ivr/incoming`.