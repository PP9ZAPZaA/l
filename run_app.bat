@echo off
title DC-Access Master Local Web Server
echo ========================================================
echo   Starting Data Center Access Master Server...
echo   (a browser window will open automatically)
echo ========================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
