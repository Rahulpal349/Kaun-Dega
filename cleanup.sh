#!/bin/bash
# ==============================================================================
# Kaun Dega - Safe Project Cleanup Script (Bash)
# ==============================================================================
# This script creates a git backup branch, removes bloated build/cache folders,
# cleans npm, and generates a report on the disk space saved.
# ==============================================================================

echo "================================================================"
echo "          Kaun Dega - Next.js Safe Cleanup Utility"
echo "================================================================"

# --- 1. Pre-Flight Safety Checks ---
if ! command -v git &> /dev/null; then
    echo "❌ ERROR: Git is not installed or not in PATH."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed or not in PATH."
    exit 1
fi

# Calculate initial disk usage (in MB)
INITIAL_SIZE=$(du -sm . | awk '{print $1}')

# --- 2. Interactive Confirmation ---
echo "⚠️ WARNING: This script will delete the following items:"
echo "   - node_modules/"
echo "   - .next/"
echo "   - dist/, build/, .turbo/"
echo "   - *.log, .DS_Store"
echo ""
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Cleanup aborted by user."
    exit 1
fi

# --- 3. Create Backup Branch ---
BACKUP_BRANCH="archive/cleanup-$(date +%Y%m%d)"
echo "📌 Creating backup branch: $BACKUP_BRANCH..."
# Commit any dangling changes before branching (optional, but safe)
git add .
git commit -m "Auto-commit before cleanup script" &> /dev/null
if git branch | grep -q "$BACKUP_BRANCH"; then
    echo "⚠️ Backup branch already exists for today. Proceeding..."
else
    git branch "$BACKUP_BRANCH"
    echo "✅ Backup branch created."
fi

# --- 4. Remove Temporary Files ---
echo "🗑️  Deleting temporary build files and caches..."
declare -a FILES_TO_DELETE=("node_modules" ".next" "dist" "build" ".turbo" ".DS_Store")

for item in "${FILES_TO_DELETE[@]}"; do
    if [ -e "$item" ]; then
        rm -rf "$item"
        echo "   - Deleted $item"
    fi
done

# Delete log files separately
find . -maxdepth 1 -name "*.log" -type f -delete
echo "   - Deleted *.log files"

# --- 5. NPM Cleanup ---
echo "🧹 Cleaning npm cache and pruning unused dependencies..."
npm cache clean --force
npm prune
echo "✅ NPM cleanup complete."

# --- 6. Verify Important Files ---
echo "🔍 Verifying critical project files..."
declare -a CRITICAL_FILES=("package.json" "next.config.js")

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ WARNING: Critical file missing -> $file"
    else
        echo "   - Found $file"
    fi
done

if [ ! -d "app" ] && [ ! -d "pages" ] && [ ! -d "src" ]; then
    echo "❌ WARNING: No source directory (app/, pages/, or src/) found!"
else
    echo "   - Source directory verified."
fi

# --- 7. Generate Cleanup Report ---
# Calculate final disk usage (in MB)
FINAL_SIZE=$(du -sm . | awk '{print $1}')
FREED_SPACE=$((INITIAL_SIZE - FINAL_SIZE))

echo "================================================================"
echo "                      CLEANUP REPORT                            "
echo "================================================================"
echo "📉 Initial Project Size : ~${INITIAL_SIZE} MB"
echo "📈 Final Project Size   : ~${FINAL_SIZE} MB"
echo "🎉 Disk Space Freed     : ~${FREED_SPACE} MB"
echo "================================================================"

# --- 8. Final Git Status ---
echo "📂 Current Git Status:"
git status -s

echo ""
echo "✅ Cleanup finished successfully!"
echo "🔄 ROLLBACK INSTRUCTIONS: If something broke, run: 'git checkout $BACKUP_BRANCH' to inspect the backup, then 'npm ci' to restore node_modules."
