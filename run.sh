#\!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 Starting AlphaPulse India (NSE/BSE Quantitative App)..."
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ \! -d "backend/venv" ]; then
  echo "📦 Creating Python virtual environment in backend/venv..."
  python3 -m venv backend/venv
fi

echo "📦 Installing backend requirements..."
./backend/venv/bin/pip install --quiet --upgrade pip
./backend/venv/bin/pip install --quiet -r backend/requirements.txt

if [ \! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend npm packages..."
  cd frontend && npm install --silent && cd ..
fi

cleanup() {
  echo ""
  echo "🛑 Shutting down AlphaPulse India servers..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

if lsof -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "⚠️  Port 8000 already in use; assuming backend is already running."
else
  echo "⚡ Launching FastAPI Backend on http://localhost:8000..."
  export PYTHONPATH="$SCRIPT_DIR"
  ./backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
  sleep 2
fi

echo "✨ Launching Vite React Frontend on http://localhost:5173..."
cd frontend
if lsof -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "⚠️  Port 5173 already in use; leaving the existing frontend running."
else
  npm run dev -- --host 127.0.0.1 --port 5173 &
fi

wait
