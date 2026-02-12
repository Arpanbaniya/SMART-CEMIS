@echo off
REM ============================================================================
REM  FULLY AUTOMATED RECOMMENDATION ANALYSIS SETUP & RUN SCRIPT
REM  (Windows Batch File)
REM  
REM  This script will:
REM  1. Check Python installation
REM  2. Install required packages
REM  3. Verify MongoDB connection
REM  4. Run the analysis
REM  5. Open graphs
REM ============================================================================

echo.
echo ============================================================================
echo   RECOMMENDATION ENGINE ACCURACY ANALYSIS SETUP
echo ============================================================================
echo.

REM Check if Python is installed
echo [1/5] Checking Python installation...
python --version >nul 2>&1

if errorlevel 1 (
    echo.
    echo ^❌ PYTHON NOT FOUND!
    echo.
    echo    Please install Python 3.8+ from:
    echo    https://www.python.org/downloads/
    echo.
    echo    Make sure to check: "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
) else (
    for /f "delims= " %%i in ('python --version') do set PYVER=%%i
    echo ^✅ Found: %PYVER%
    echo.
)

REM Install dependencies
echo [2/5] Installing Python packages...
echo    (matplotlib, numpy, pandas, pymongo, seaborn)
echo.
pip install --quiet matplotlib numpy pandas pymongo seaborn >nul 2>&1

if errorlevel 1 (
    echo.
    echo ^⚠️  Some packages failed to install. Attempting alternative method...
    python -m pip install --quiet matplotlib numpy pandas pymongo seaborn
    if errorlevel 1 (
        echo.
        echo ^❌ Failed to install packages!
        echo.
        echo    Run manually:
        echo    pip install matplotlib numpy pandas pymongo seaborn
        echo.
        pause
        exit /b 1
    )
)

echo ^✅ All packages installed successfully!
echo.

REM Check MongoDB
echo [3/5] Checking MongoDB connection...
mongosh --eval "db.adminCommand('ping')" --quiet >nul 2>&1

if errorlevel 1 (
    echo.
    echo ^❌ MONGODB NOT RUNNING!
    echo.
    echo    MongoDB must be running on localhost:27017
    echo.
    echo    To start MongoDB:
    echo    1. Windows: Run mongod.exe from C:\Program Files\MongoDB\Server\<version>\bin
    echo    2. Or go to Services (services.msc) and start "MongoDB Server"
    echo.
    echo    Then run this script again.
    echo.
    pause
    exit /b 1
) else (
    echo ^✅ MongoDB is running!
    echo.
)

REM Run analysis
echo [4/5] Running recommendation analysis...
echo    (Connecting to eventhub database)
echo.
python recommendation_accuracy_analysis.py

if errorlevel 1 (
    echo.
    echo ^❌ Analysis failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Opening graphs...
echo.

REM Open graphs if they exist
if exist "1_algorithm_comparison.png" (
    start 1_algorithm_comparison.png
    echo ^✅ Opening algorithm comparison graph...
)

if exist "2_user_distribution.png" (
    start 2_user_distribution.png
    echo ^✅ Opening user distribution graph...
)

if exist "3_segment_analysis.png" (
    start 3_segment_analysis.png
    echo ^✅ Opening segment analysis graph...
)

if exist "4_radar_chart.png" (
    start 4_radar_chart.png
    echo ^✅ Opening radar chart...
)

if exist "5_training_progress.png" (
    start 5_training_progress.png
    echo ^✅ Opening training progress...
)

echo.
echo ============================================================================
echo   ✅ SUCCESS! ANALYSIS COMPLETE
echo ============================================================================
echo.
echo   Graph files saved to:
echo   %CD%
echo.
echo   Generated files:
echo   - 1_algorithm_comparison.png
echo   - 2_user_distribution.png
echo   - 3_segment_analysis.png
echo   - 4_radar_chart.png
echo   - 5_training_progress.png
echo.
echo   Use these graphs in your project documentation!
echo.
pause
