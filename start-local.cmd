@echo off
setlocal
cd /d "%~dp0nextjs-app"
call npm.cmd run start:local
