@echo off
REM Onboarding Analysis Tool Launcher (Windows Batch File)
REM This is a simpler alternative to the .exe that Windows trusts more

REM Ensure required folders exist before launching
if not exist "%~dp0backend\uploads" mkdir "%~dp0backend\uploads"
if not exist "%~dp0backend\outputs" mkdir "%~dp0backend\outputs"
if not exist "%~dp0backend\data" mkdir "%~dp0backend\data"
if not exist "%~dp0uploads" mkdir "%~dp0uploads"
if not exist "%~dp0outputs" mkdir "%~dp0outputs"

REM Install frontend dependencies if missing
if not exist "%~dp0frontend\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%~dp0frontend"
    npm install
    cd /d "%~dp0"
)

REM Launch the Python launcher script
cd /d "%~dp0"
python launcher.py

pause
