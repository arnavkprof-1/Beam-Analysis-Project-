@echo off
title VECTRON BEAM-CORE Localhost Server
echo ======================================================================
echo   Starting VECTRON BEAM-CORE on http://localhost:8080
echo ======================================================================
start "" "http://localhost:8080"
node "%~dp0server.js"
pause
