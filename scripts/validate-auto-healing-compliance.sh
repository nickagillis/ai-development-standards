#!/bin/bash
# Auto-Healing Compliance Validation Script
# GitHub Actions compatible wrapper for compliance validation

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source auto-healing commons with error handling
if [[ -f "${SCRIPT_DIR}/auto-healing-commons.sh" ]]; then
    source "${SCRIPT_DIR}/auto-healing-commons.sh"
else
    echo "❌ Error: auto-healing-commons.sh not found"
    exit 1
fi

# Run compliance validation
echo "🔍 Running auto-healing compliance validation..."

if validate_auto_healing_compliance; then
    echo "✅ Auto-healing compliance validation passed"
    exit 0
else
    echo "❌ Auto-healing compliance validation failed"
    exit 1
fi
