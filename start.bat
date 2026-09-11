@echo off
title Berry Food Tracker

cd /d "%~dp0"

echo.
echo ========================================
echo       BERRY FOOD TRACKER
echo ========================================
echo.
echo Starting Backend...
echo Starting Frontend...
echo.

REM ==================================================
REM START BACKEND
REM ==================================================

start "Berry AI Backend" cmd /k "cd /d "%~dp0Backend" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"


REM ==================================================
REM START FRONTEND
REM ==================================================

start "Berry Frontend" cmd /k "cd /d "%~dp0" && python -m http.server 5500 --directory www"


REM ==================================================
REM WAIT FOR SERVERS
REM ==================================================

timeout /t 4 /nobreak >nul


REM ==================================================
REM OPEN BERRY FOOD TRACKER
REM ==================================================

start "" "http://127.0.0.1:5500"


echo.
echo ========================================
echo       BERRY FOOD TRACKER STARTED
echo ========================================
echo.
echo Frontend:
echo http://127.0.0.1:5500
echo.
echo Backend:
echo http://127.0.0.1:8000
echo.
echo ========================================
echo.
pause