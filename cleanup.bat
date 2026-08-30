@echo off
setlocal enabledelayedexpansion
:: ==============================================================================
:: Kaun Dega - Safe Project Cleanup Script (Windows Batch)
:: ==============================================================================

echo ================================================================
echo           Kaun Dega - Next.js Safe Cleanup Utility
echo ================================================================

:: --- 1. Pre-Flight Safety Checks ---
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] ERROR: Git is not installed or not in PATH.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] ERROR: npm is not installed or not in PATH.
    pause
    exit /b 1
)

:: --- 2. Interactive Confirmation ---
echo WARNING: This script will delete the following items:
echo    - node_modules\
echo    - .next\
echo    - dist\, build\, .turbo\
echo    - *.log, Thumbs.db
echo.
set /p proceed="Are you sure you want to proceed? (Y/N) "
if /I not "%proceed%"=="Y" (
    echo Cleanup aborted by user.
    pause
    exit /b 1
)

:: --- 3. Create Backup Branch ---
:: Get date in YYYYMMDD format independent of regional settings
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set YYYYMMDD=%datetime:~0,8%
set BACKUP_BRANCH=archive/cleanup-%YYYYMMDD%

echo [📌] Creating backup branch: %BACKUP_BRANCH%...
git add .
git commit -m "Auto-commit before cleanup script" >nul 2>nul

git branch | findstr /C:"%BACKUP_BRANCH%" >nul
if %errorlevel% equ 0 (
    echo [!] Backup branch already exists for today. Proceeding...
) else (
    git branch %BACKUP_BRANCH%
    echo [OK] Backup branch created.
)

:: --- 4. Remove Temporary Files ---
echo [🗑️] Deleting temporary build files and caches...

for %%d in (node_modules .next dist build .turbo) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
        echo    - Deleted %%d\
    )
)

if exist "*.log" (
    del /q /f "*.log"
    echo    - Deleted *.log files
)

if exist "Thumbs.db" (
    del /q /f /a "Thumbs.db"
    echo    - Deleted Thumbs.db
)

:: --- 5. NPM Cleanup ---
echo [🧹] Cleaning npm cache and pruning unused dependencies...
call npm cache clean --force
call npm prune
echo [OK] NPM cleanup complete.

:: --- 6. Verify Important Files ---
echo [🔍] Verifying critical project files...

for %%f in (package.json next.config.js) do (
    if not exist "%%f" (
        echo [X] WARNING: Critical file missing -^> %%f
    ) else (
        echo    - Found %%f
    )
)

if not exist "app\" if not exist "pages\" if not exist "src\" (
    echo [X] WARNING: No source directory (app\, pages\, or src\) found!
) else (
    echo    - Source directory verified.
)

:: --- 7. Final Git Status ---
echo ================================================================
echo [📂] Current Git Status:
git status -s

echo.
echo [OK] Cleanup finished successfully!
echo [🔄] ROLLBACK INSTRUCTIONS: If something broke, run 'git checkout %BACKUP_BRANCH%' to inspect the backup, then run 'npm ci' to restore node_modules.
pause
