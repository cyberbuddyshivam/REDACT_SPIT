@echo off
REM MediGuard ML Integration - Quick Start Script for Windows

echo Starting MediGuard with ML Integration...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed. Please install Python 3.8+
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js 16+
    exit /b 1
)

echo Prerequisites check passed
echo.

REM Start ML API
echo Starting ML API on port 5000...
cd ml
start "ML API" cmd /k "python -m uvicorn src.app:app --host 0.0.0.0 --port 5000"
cd ..

REM Wait for ML API to start
timeout /t 3 /nobreak >nul

REM Check ML API health
echo Checking ML API health...
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: ML API might not be fully started yet
) else (
    echo ML API is running
)

echo.

REM Start Backend
echo Starting Backend on port 8000...
cd backend
start "Backend API" cmd /k "npm run dev"
cd ..

REM Wait for backend to start
timeout /t 5 /nobreak >nul

echo.

REM Start Frontend
echo Starting Frontend on port 5173...
cd frontend2\frontend
start "Frontend" cmd /k "npm run dev"
cd ..\..

echo.
echo All services started successfully!
echo.
echo Services running:
echo   - ML API:    http://localhost:5000
echo   - Backend:   http://localhost:8000
echo   - Frontend:  http://localhost:5173
echo.
echo To stop services, close the respective command windows
echo.

pause
