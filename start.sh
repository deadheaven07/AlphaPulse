#!/bin/bash

# AlphaHorizon Startup Script
echo "=========================================================="
echo " Starting AlphaHorizon (India Equity & ROI Simulator)"
echo "=========================================================="

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
    ./backend/venv/bin/pip install -r backend/requirements.txt
fi

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend packages..."
    cd frontend && npm install && cd ..
fi

echo "Starting FastAPI Backend on http://127.0.0.1:8000..."
./backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting Vite React Frontend on http://localhost:5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Trap SIGINT to kill background processes on exit
trap "echo 'Stopping AlphaHorizon services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
