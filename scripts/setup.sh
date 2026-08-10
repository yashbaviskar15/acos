#!/usr/bin/env bash
set -e

echo "=================================================="
echo "   Aravanta CloudOS — Local Setup & Initializer"
echo "=================================================="

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "Python3 is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }

echo "[1/4] Installing Python backend dependencies..."
pip install -r backend/requirements.txt

echo "[2/4] Installing Node frontend dependencies..."
cd frontend && npm install && cd ..

echo "[3/4] Initializing database and seeding default users..."
PYTHONPATH=backend python3 scripts/seed.py

echo "[4/4] Setup completed successfully!"
echo "Run 'docker-compose -f docker/docker-compose.yml up -d' to start the full stack."
