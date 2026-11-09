@echo off
title Beam Diagnostics Web Server
cd /d "%~dp0"
echo ============================================================
echo   STRUCTURAL BEAM ANALYSIS: SFD & BMD DIAGNOSTICS STUDIO
echo ============================================================
echo Starting local web server on http://localhost:8085 ...

start "" http://localhost:8085
python -m http.server 8085
