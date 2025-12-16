# Application Launcher Guide

This guide explains how to use the launcher scripts to run the Onboarding Analysis Tool.

## 📋 Prerequisites

The launcher will automatically check for these requirements:

- **Node.js** (Latest LTS version recommended)
- **npm** (comes with Node.js)
- **Python 3.9+**
- **pip** (comes with Python)
- **venv module** (usually included with Python)

## 🚀 Quick Start

### Option 1: Using the Windows Batch File (RECOMMENDED for Windows)

Simply **double-click `LAUNCH.bat`** in the project folder. This is the easiest and most reliable method for Windows users.

### Option 2: Using the Bash Script (Git Bash/WSL/Linux/Mac)

```bash
./launch.sh
```

### Option 3: Using the Python Script Directly (All platforms)

```bash
python launcher.py
```

## 📝 What the Launcher Does

### 1️⃣ Environment Checks
- ✓ Checks if Node.js is installed
- ✓ Checks if npm is installed
- ✓ Checks if Python 3.9+ is installed
- ✓ Checks if pip is installed
- ✓ Checks if venv module is available

### 2️⃣ Backend Setup
- Creates required directories (`uploads`, `outputs`, `data`)
- Checks Python dependencies from `requirements.txt`
- Installs missing packages automatically
- Verifies all packages are properly installed

### 3️⃣ Frontend Setup
- Checks if npm dependencies are installed
- Installs npm dependencies (if not already installed)

### 4️⃣ Launch Services
- Starts the backend server on `http://localhost:8000`
- Starts the frontend development server on `http://localhost:5173`
- Keeps both running until you press Ctrl+C

## 🛑 Stopping the Application

Press `Ctrl+C` in the terminal/console where the launcher is running. The launcher will gracefully shut down both services.

## 🐛 Troubleshooting

### "Command not found" errors

Make sure the required software is in your system PATH:
- Node.js and npm
- Python and pip

### Backend/Frontend fails to start

- Check if ports 8000 or 5173 are already in use
- Make sure dependencies are properly installed
- Check console output for specific error messages

### Python package installation fails

If you get errors about missing packages:
```bash
cd backend
pip install -r requirements.txt
```

### npm installation fails

If frontend dependencies fail to install:
```bash
cd frontend
npm install
```

## 📦 Sharing the Application

When sharing the project with others:

1. They need to install:
   - Node.js and npm
   - Python 3.9+ and pip

2. Share the entire project folder (including backend/ and frontend/)

3. They can run it using:
   - Windows: Double-click `LAUNCH.bat`
   - Mac/Linux: Run `./launch.sh` or `python launcher.py`

4. First run will take longer as dependencies are installed

## 💡 Tips

- **First run**: May take longer as it installs dependencies
- **Subsequent runs**: Much faster as dependencies are cached
- **Keep project together**: All files should stay in their folders
- **Check logs**: Console output shows detailed progress and any errors
- **Port conflicts**: If ports 8000 or 5173 are in use, stop other services first
