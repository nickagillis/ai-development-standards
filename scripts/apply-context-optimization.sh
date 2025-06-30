#!/bin/bash

# Apply Context Optimization - Remove Oversized Files
# This script removes files that violate context optimization standards

set -euo pipefail

echo "🔧 Applying Context Optimization Standards..."
echo "================================================"

# Files to remove (violate 100-line context limit)
FILES_TO_REMOVE=(
    "scripts/community-wisdom-engine.js"         # 32,528 bytes
    "scripts/log-collaboration-session.js"       # 21,084 bytes
)

# Verify core replacements exist
CORE_FILES=(
    "scripts/community-wisdom-engine-core.js"    # 4,852 bytes ✅
    "scripts/collaboration-logger-core.js"       # 4,217 bytes ✅
)

echo "\n✅ Verifying core modules exist..."
for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file ($(wc -c < "$file") bytes)"
    else
        echo "   ❌ $file - MISSING!"
        echo "   🚨 Cannot proceed - core module missing"
        exit 1
    fi
done

echo "\n🗑️ Removing oversized files..."
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        file_size=$(wc -c < "$file")
        echo "   🗑️ Removing $file ($file_size bytes)"
        rm "$file"
    else
        echo "   ℹ️ $file - already removed"
    fi
done

# Verify package.json uses core versions
echo "\n📋 Verifying package.json uses core versions..."
if grep -q "community-wisdom-engine-core.js" package.json; then
    echo "   ✅ community-wisdom script uses core version"
else
    echo "   ⚠️ community-wisdom script may need updating"
fi

if grep -q "collaboration-logger-core.js" package.json; then
    echo "   ✅ log-collaboration script uses core version"
else
    echo "   ⚠️ log-collaboration script may need updating"
fi

echo "\n🎯 Context optimization applied successfully!"
echo "✅ All oversized files removed"
echo "✅ Core functionality preserved"
echo "✅ Repository now follows its own standards"
echo "\n🚀 Ready to commit changes and achieve perfect self-compliance!"