#!/bin/bash

# MediGuard ML Integration - Quick Start Script

echo "🚀 Starting MediGuard with ML Integration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo -e "${RED}❌ Python is not installed. Please install Python 3.8+${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Start ML API
echo -e "${YELLOW}📊 Starting ML API on port 5000...${NC}"
cd ml
python -m uvicorn src.app:app --host 0.0.0.0 --port 5000 &
ML_PID=$!
echo "ML API PID: $ML_PID"
cd ..

# Wait for ML API to start
sleep 3

# Check ML API health
echo -e "${YELLOW}🔍 Checking ML API health...${NC}"
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✅ ML API is running${NC}"
else
    echo -e "${RED}❌ ML API failed to start${NC}"
    kill $ML_PID 2>/dev/null
    exit 1
fi

echo ""

# Start Backend
echo -e "${YELLOW}⚙️  Starting Backend on port 8000...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Wait for backend to start
sleep 5

echo ""

# Start Frontend
echo -e "${YELLOW}🎨 Starting Frontend on port 5173...${NC}"
cd frontend2/frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ../..

echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo "Services running:"
echo "  - ML API:    http://localhost:5000"
echo "  - Backend:   http://localhost:8000"
echo "  - Frontend:  http://localhost:5173"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""

# Keep script running and handle Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

wait
