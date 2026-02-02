#!/usr/bin/env python3
"""
Windows Launcher for Onboarding Analysis Tool
This script can be converted to .exe using PyInstaller
"""

import os
import sys
import subprocess
import shutil
import time
import signal
from pathlib import Path

# Color codes for Windows console
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def get_python_executable():
    """Get the actual Python executable path"""
    if getattr(sys, 'frozen', False):
        # Running as compiled executable - find the actual Python
        python_exe = shutil.which("python") or shutil.which("python3")
        if not python_exe:
            error_exit(
                "Python executable not found in PATH",
                "Please ensure Python is installed and added to your system PATH"
            )
        return python_exe
    else:
        # Running as script
        return sys.executable

def print_header():
    """Print application header"""
    print("=" * 50)
    print("  Onboarding Analysis Tool Launcher")
    print("=" * 50)
    print()

def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}✗ ERROR: {message}{Colors.END}")

def print_warning(message):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")

def error_exit(message, suggestion=""):
    """Print error and exit"""
    print_error(message)
    if suggestion:
        print(f"\n{suggestion}")
    print("\nPress Enter to exit...")
    input()
    sys.exit(1)

def check_command(command, name, error_msg, download_url=""):
    """Check if a command exists"""
    print(f"Checking {name}... ", end="", flush=True)
    
    if shutil.which(command):
        try:
            result = subprocess.run(
                [command, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            version = result.stdout.split()[0] if result.stdout else ""
            print_success(f"{name} {version} found")
            return True
        except Exception as e:
            print_success(f"{name} found")
            return True
    else:
        suggestion = f"Download from {download_url}" if download_url else ""
        error_exit(error_msg, suggestion)
        return False

def check_python_version():
    """Check Python version is 3.9+"""
    print(f"Checking Python 3.9+... ", end="", flush=True)
    
    version_info = sys.version_info
    version_str = f"{version_info.major}.{version_info.minor}.{version_info.micro}"
    
    if version_info.major < 3 or (version_info.major == 3 and version_info.minor < 9):
        error_exit(
            f"Python 3.9+ required, but found Python {version_str}",
            "Download Python 3.9 or higher from https://www.python.org/"
        )
    
    print_success(f"Python {version_str} found")
    return True

def check_pip():
    """Check if pip is available"""
    print(f"Checking pip... ", end="", flush=True)
    
    python_exe = get_python_executable()
    
    try:
        result = subprocess.run(
            [python_exe, "-m", "pip", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version = result.stdout.split()[1] if result.stdout else ""
            print_success(f"pip {version} found")
            return True
        else:
            error_exit(
                "pip is not available",
                f"Install with: {python_exe} -m ensurepip --upgrade"
            )
    except Exception as e:
        error_exit(
            "pip check failed",
            f"Install with: {python_exe} -m ensurepip --upgrade"
        )
    return False

def check_venv():
    """Check if venv module is available"""
    print(f"Checking venv module... ", end="", flush=True)
    
    python_exe = get_python_executable()
    
    try:
        result = subprocess.run(
            [python_exe, "-m", "venv", "--help"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print_success("venv module available")
            return True
        else:
            print_warning("venv module not found. Proceeding without virtual environment.")
            return False
    except Exception:
        print_warning("venv module not found. Proceeding without virtual environment.")
        return False

def run_environment_checks():
    """Run all environment checks"""
    print("1️⃣ ENVIRONMENT CHECKS")
    print("─" * 50)
    print()
    
    # Check Node.js
    check_command(
        "node",
        "Node.js",
        "Node.js is not installed.",
        "https://nodejs.org/"
    )
    
    # Check npm
    check_command(
        "npm",
        "npm",
        "npm is not installed. It should come with Node.js installation.",
        "https://nodejs.org/"
    )
    
    # Check Python version
    check_python_version()
    
    # Check pip
    check_pip()
    
    # Check venv
    check_venv()
    
    print()
    print(f"{Colors.GREEN}✓ All environment checks passed!{Colors.END}")
    print()

def check_python_packages(packages):
    """Check if Python packages are installed"""
    # Common package name mappings (pip name -> import name)
    name_mappings = {
        'python-multipart': 'multipart',
        'python-dateutil': 'dateutil',
        'python-Levenshtein': 'Levenshtein',
        'python-dotenv': 'dotenv',
    }
    
    missing = []
    for package in packages:
        # Extract package name without version specifiers
        package_name = package.split('>=')[0].split('==')[0].split('[')[0].strip()
        
        # Get the actual import name
        import_name = name_mappings.get(package_name, package_name)
        
        # Try with underscore replacement as fallback
        try:
            __import__(import_name.replace('-', '_'))
        except ImportError:
            try:
                __import__(import_name)
            except ImportError:
                try:
                    # Try original package name
                    __import__(package_name.replace('-', '_'))
                except ImportError:
                    missing.append(package_name)
    return missing

def setup_backend(project_root):
    """Setup backend environment"""
    print("2️⃣ BACKEND SETUP")
    print("─" * 50)
    print()
    
    python_exe = get_python_executable()
    backend_dir = project_root / "backend"
    os.chdir(backend_dir)
    
    # Create required directories
    print("Creating required directories...")
    for dir_name in ["uploads", "outputs", "data"]:
        (backend_dir / dir_name).mkdir(exist_ok=True)
    print_success("Directories created")
    
    # Check and install Python dependencies
    requirements_file = backend_dir / "requirements.txt"
    if requirements_file.exists():
        print("Checking Python dependencies from requirements.txt...")
        
        # Read and parse requirements.txt
        with open(requirements_file, 'r') as f:
            requirements = [line.strip() for line in f 
                          if line.strip() and not line.startswith('#')]
        
        # Extract package names from requirements
        required_packages = []
        for req in requirements:
            # Extract package name without version specifiers
            package_name = req.split('>=')[0].split('==')[0].split('[')[0].strip()
            if package_name:
                required_packages.append(package_name)
        
        if not required_packages:
            print_warning("No packages found in requirements.txt")
            print()
            return
        
        print(f"Checking {len(required_packages)} packages...")
        
        # Check if packages are installed
        missing = check_python_packages(required_packages)
        
        if missing:
            print(f"Missing packages ({len(missing)}): {', '.join(missing[:5])}")
            if len(missing) > 5:
                print(f"  ... and {len(missing) - 5} more")
            print("Installing Python dependencies...")
            try:
                subprocess.run(
                    [python_exe, "-m", "pip", "install", "-r", "requirements.txt"],
                    check=True,
                    timeout=300
                )
                
                # Verify installation
                still_missing = check_python_packages(required_packages)
                if still_missing:
                    error_exit(
                        f"Failed to install required packages: {', '.join(still_missing)}",
                        "Please install them manually or check your internet connection."
                    )
                
                print_success(f"All {len(required_packages)} Python dependencies installed and verified")
            except subprocess.CalledProcessError as e:
                error_exit(
                    "Failed to install Python dependencies",
                    f"Try manually: {python_exe} -m pip install -r backend/requirements.txt"
                )
            except subprocess.TimeoutExpired:
                error_exit(
                    "Dependency installation timed out",
                    "Check your internet connection and try again."
                )
        else:
            print_success(f"All {len(required_packages)} required Python packages already installed")
    else:
        print_warning("requirements.txt not found, skipping...")
    
    print()

def setup_frontend(project_root):
    """Setup frontend environment"""
    print("3️⃣ FRONTEND SETUP")
    print("─" * 50)
    print()
    
    frontend_dir = project_root / "frontend"
    os.chdir(frontend_dir)
    
    # Install npm dependencies if needed
    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        print("Installing npm dependencies (this may take a moment)...")
        try:
            subprocess.run(["npm", "install"], check=True, timeout=600)
            print_success("npm dependencies installed")
        except subprocess.CalledProcessError:
            print_error("npm install failed")
        except subprocess.TimeoutExpired:
            print_error("npm install timed out")
    else:
        print("npm dependencies already installed")
        print_success("Skipping installation")
    
    print()

def launch_services(project_root):
    """Launch backend and frontend services"""
    print("4️⃣ LAUNCHING SERVICES")
    python_exe = get_python_executable()
    processes = []
    
    # Start backend
    print("Starting backend server...")
    backend_dir = project_root / "backend"
    try:
        backend_process = subprocess.Popen(
            [python_exe, "main.py"],
            cwd=backend_dir,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
        )
        processes.append(("Backend", backend_process))
        print_success(f"Backend started (PID: {backend_process.pid})")
        print("   Backend running at: http://localhost:8000")
    except Exception as e:
        print_error(f"Failed to start backend: {e}")
        return processes
    
    # Wait for backend to initialize
    time.sleep(2)
    
    # Start frontend
    print()
    print("Starting frontend server...")
    frontend_dir = project_root / "frontend"
    
    # Find npm executable
    npm_cmd = shutil.which("npm")
    if not npm_cmd:
        npm_cmd = shutil.which("npm.cmd")  # Windows uses npm.cmd
    
    if not npm_cmd:
        print_error("npm command not found in PATH")
        return processes
    
    try:
        # On Windows, use shell=True and let npm handle the script execution
        # This ensures npm can find vite in node_modules/.bin
        if sys.platform == "win32":
            frontend_process = subprocess.Popen(
                f'"{npm_cmd}" run dev',
                cwd=frontend_dir,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                shell=True
            )
        else:
            frontend_process = subprocess.Popen(
                [npm_cmd, "run", "dev"],
                cwd=frontend_dir
            )
        processes.append(("Frontend", frontend_process))
        print_success(f"Frontend started (PID: {frontend_process.pid})")
        print("   Frontend will be available at: http://localhost:5173")
    except Exception as e:
        print_error(f"Failed to start frontend: {e}")
    
    print()
    print("=" * 50)
    print(f"{Colors.GREEN}✓ APPLICATION LAUNCHED SUCCESSFULLY!{Colors.END}")
    print("=" * 50)
    print()
    print("Backend:  http://localhost:8000")
    print("Frontend: http://localhost:5173")
    print()
    print("Press Ctrl+C to stop all services")
    print()
    
    return processes

def cleanup(processes):
    """Cleanup and stop all processes"""
    print()
    print("Shutting down services...")
    for name, process in processes:
        try:
            if sys.platform == "win32":
                # Windows-specific termination
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(process.pid)],
                    capture_output=True
                )
            else:
                process.terminate()
                process.wait(timeout=5)
            print(f"  {name} stopped")
        except Exception as e:
            print(f"  {name} may still be running (PID: {process.pid})")
    print("Services stopped.")

def main():
    """Main launcher function"""
    # Enable color output on Windows
    if sys.platform == "win32":
        os.system("")  # Enable ANSI color codes
    
    print_header()
    
    # Get project root directory
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        project_root = Path(sys.executable).parent
    else:
        # Running as script
        project_root = Path(__file__).parent
    
    try:
        # Run environment checks
        run_environment_checks()
        
        # Setup backend
        setup_backend(project_root)
        
        # Setup frontend
        setup_frontend(project_root)
        
        # Launch services
        processes = launch_services(project_root)
        
        # Wait for user interrupt
        try:
            while True:
                time.sleep(1)
                # Check if processes are still running
                for name, process in processes:
                    if process.poll() is not None:
                        print_warning(f"{name} has stopped unexpectedly")
                        raise KeyboardInterrupt
        except KeyboardInterrupt:
            pass
        
    except KeyboardInterrupt:
        pass
    finally:
        if 'processes' in locals():
            cleanup(processes)
    
    print("\nPress Enter to exit...")
    input()

if __name__ == "__main__":
    main()
