@echo off
title Beam Diagnostics CAD Studio
cd /d "%~dp0"
echo ============================================================
echo   STRUCTURAL BEAM ANALYSIS: SFD & BMD DIAGNOSTICS STUDIO
echo ============================================================
echo Starting native desktop application window...

if exist "..\desktop-app\node_modules\.bin\electron.cmd" (
    call "..\desktop-app\node_modules\.bin\electron.cmd" .
) else (
    call npx electron .
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Electron launch exited. Opening in web application fallback mode...
    start "" index.html
)
