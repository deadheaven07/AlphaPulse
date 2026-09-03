#!/usr/bin/env bash

# Exit on error
set -e

echo "=========================================================="
echo "🚀 Starting AlphaPulse India (NSE/BSE Quantitative App)..."
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Setup Backend Virtual Environment
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating Python virtual environment in backend/venv..."
    python3 -m venv backend/venv
fi

echo "📦 Installing backend requirements..."
./backend/venv/bin/pip install --quiet --upgrade pip
./backend/venv/bin/pip install --quiet -r backend/requirements.txt

# 2. Setup Frontend Packages
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend npm packages..."
    cd frontend && npm install --silent && cd ..
fi

# Function to kill all child processes on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down AlphaPulse India servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start Backend FastAPI Server
echo "⚡ Launching FastAPI Backend on http://localhost:8000..."
export PYTHONPATH="$SCRIPT_DIR"
./backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# 4. Start Frontend Vite Server
echo "✨ Launching Vite React Frontend on http://localhost:5173..."
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "🎉 AlphaPulse India is LIVE!"
echo "   • Web Dashboard: http://localhost:5173"
echo "   • Backend API Docs: http://localhost:8000/docs"
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."

# Wait for background processes
wait
