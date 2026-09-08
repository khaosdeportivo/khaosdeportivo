@echo off
cd /d "%~dp0"
echo ============================================
echo   Publicando Khaos Deportivo con Wrangler
echo ============================================
echo.
npx wrangler deploy
echo.
echo ============================================
echo   Listo. Revisa arriba si hubo errores.
echo ============================================
pause
