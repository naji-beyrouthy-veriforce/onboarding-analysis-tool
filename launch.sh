#!/bin/bash
# Unified launcher for Onboarding Analysis Tool
# Performs environment checks and launches both backend and frontend

set -e  # Exit on error

echo "=========================================="
echo "  Onboarding Analysis Tool Launcher"
echo "=========================================="
echo ""

# Color codes for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print error and exit
error_exit() {
    echo -e "${RED}✗ ERROR: $1${NC}" >&2
    echo ""
    echo "Please install the missing dependency and try again."
    exit 1
}

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo "1️⃣ ENVIRONMENT CHECKS"
echo "─────────────────────────────────────────"
echo ""

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js $NODE_VERSION found"
else
    error_exit "Node.js is not installed. Download from https://nodejs.org/"
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    success "npm $NPM_VERSION found"
else
    error_exit "npm is not installed. It should come with Node.js installation."
fi

# Check Python
echo -n "Checking Python 3.9+... "
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    error_exit "Python is not installed. Download from https://www.python.org/"
fi

# Verify Python version
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
PYTHON_MAJOR=$($PYTHON_CMD -c 'import sys; print(sys.version_info.major)')
PYTHON_MINOR=$($PYTHON_CMD -c 'import sys; print(sys.version_info.minor)')

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 9 ]); then
    error_exit "Python 3.9+ required, but found Python $PYTHON_VERSION"
fi
success "Python $PYTHON_VERSION found"

# Check pip
echo -n "Checking pip... "
if command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
elif command -v pip &> /dev/null; then
    PIP_CMD="pip"
else
    error_exit "pip is not installed. Install with: $PYTHON_CMD -m ensurepip --upgrade"
fi

PIP_VERSION=$($PIP_CMD --version 2>&1 | awk '{print $2}')
success "pip $PIP_VERSION found"

# Check virtualenv/venv
echo -n "Checking venv module... "
if $PYTHON_CMD -m venv --help &> /dev/null; then
    success "venv module available"
elif command -v virtualenv &> /dev/null; then
    success "virtualenv available"
else
    warning "venv/virtualenv not found. Proceeding without virtual environment."
fi

echo ""
echo -e "${GREEN}✓ All environment checks passed!${NC}"
echo ""

# Navigate to project root (script location)
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "2️⃣ BACKEND SETUP"
echo "─────────────────────────────────────────"
echo ""

cd "$PROJECT_ROOT/backend"

# Create required directories
echo "Creating required directories..."
mkdir -p uploads outputs data
success "Directories created"

# Check Python dependencies from requirements.txt
if [ ! -f "requirements.txt" ]; then
    error_exit "requirements.txt not found in backend directory"
fi

echo "Checking Python dependencies from requirements.txt..."
$PYTHON_CMD -c "
import sys
import re

# Read requirements.txt
with open('requirements.txt', 'r') as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]

# Extract package names
packages = []
for req in requirements:
    # Remove version specifiers
    pkg = re.split(r'[><=\[]', req)[0].strip()
    if pkg:
        packages.append(pkg)

print(f'Checking {len(packages)} packages...')

# Check which are missing
missing = []
for pkg in packages:
    # Convert package name to module name (e.g., python-multipart -> multipart)
    module_name = pkg.replace('-', '_')
    try:
        __import__(module_name)
    except ImportError:
        # Try original name
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)

if missing:
    print(f'Missing packages ({len(missing)}): {', '.join(missing[:5])}')
    if len(missing) > 5:
        print(f'  ... and {len(missing) - 5} more')
    sys.exit(1)
else:
    print(f'All {len(packages)} packages are installed')
    sys.exit(0)
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "Installing Python dependencies..."
    $PIP_CMD install -r requirements.txt
    
    # Verify installation
    $PYTHON_CMD -c "
import sys
import re

with open('requirements.txt', 'r') as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]

packages = []
for req in requirements:
    pkg = re.split(r'[><=\[]', req)[0].strip()
    if pkg:
        packages.append(pkg)

still_missing = []
for pkg in packages:
    module_name = pkg.replace('-', '_')
    try:
        __import__(module_name)
    except ImportError:
        try:
            __import__(pkg)
        except ImportError:
            still_missing.append(pkg)

if still_missing:
    print(f'Failed to install: {', '.join(still_missing)}')
    sys.exit(1)
" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        error_exit "Failed to install required Python packages. Please install manually."
    fi
    
    success "All Python dependencies installed and verified"
else
    success "All required Python packages already installed"
fi

echo ""
echo "3️⃣ FRONTEND SETUP"
echo "─────────────────────────────────────────"
echo ""

cd "$PROJECT_ROOT/frontend"

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies (this may take a moment)..."
    npm install
    success "npm dependencies installed"
else
    echo "npm dependencies already installed"
    success "Skipping installation"
fi

echo ""
echo "4️⃣ LAUNCHING SERVICES"
echo "─────────────────────────────────────────"
echo ""

# Start backend
echo "Starting backend server..."
cd "$PROJECT_ROOT/backend"
$PYTHON_CMD main.py &
BACKEND_PID=$!
success "Backend started (PID: $BACKEND_PID)"
echo "   Backend running at: http://localhost:8000"

# Wait a moment for backend to initialize
sleep 2

# Start frontend
echo ""
echo "Starting frontend server..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
success "Frontend started (PID: $FRONTEND_PID)"
echo "   Frontend will be available at: http://localhost:5173"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ APPLICATION LAUNCHED SUCCESSFULLY!${NC}"
echo "=========================================="
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Services stopped."
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait
