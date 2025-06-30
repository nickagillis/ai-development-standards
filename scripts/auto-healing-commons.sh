#!/bin/bash
# GitHub Actions Compatible Auto-Healing Commons
# Optimized for CI/CD environments with limited write permissions

# Configuration
AUTO_HEALING_ENABLED=${AUTO_HEALING_ENABLED:-true}
WISDOM_ENGINE_LOG_DIR="logs/collaboration-sessions"
HANDOFF_DOCS=("HANDOFF-SUMMARY.md" "QUICK-HANDOFF-STATUS.md")

# Create directories if writable (fallback to /tmp if not)
create_log_dirs() {
    if mkdir -p "$WISDOM_ENGINE_LOG_DIR" 2>/dev/null; then
        echo "[AUTO-HEALING] Log directories created: $WISDOM_ENGINE_LOG_DIR"
    else
        WISDOM_ENGINE_LOG_DIR="/tmp/collaboration-sessions"
        mkdir -p "$WISDOM_ENGINE_LOG_DIR"
        echo "[AUTO-HEALING] Using fallback log directory: $WISDOM_ENGINE_LOG_DIR"
    fi
    
    if ! mkdir -p "logs/auto-healing" 2>/dev/null; then
        mkdir -p "/tmp/auto-healing"
        echo "[AUTO-HEALING] Using fallback auto-healing directory: /tmp/auto-healing"
    fi
}

# Initialize directories
create_log_dirs

# Global variables for session tracking
PROCESS_START_TIME=$(date +%s)
PROCESS_CHANGES=()
PROCESS_OUTCOMES=()
PROCESS_LESSONS=()

#######################################
# Log a change (GitHub Actions compatible)
#######################################
auto_log_change() {
    local change_type="$1"
    local description="$2"
    local impact="$3"
    local files="$4"
    
    local change_entry="{
        \"timestamp\": \"$(date -Iseconds)\",
        \"type\": \"$change_type\",
        \"description\": \"$description\",
        \"impact\": \"$impact\",
        \"files\": \"$files\",
        \"process\": \"$(basename "$0")\",
        \"session_id\": \"auto-${PROCESS_START_TIME}\"
    }"
    
    PROCESS_CHANGES+=("$change_entry")
    
    # In GitHub Actions, just log - don't modify files
    if [[ "$GITHUB_ACTIONS" == "true" ]]; then
        echo "[AUTO-HEALING] Change logged (CI mode): $change_type - $description"
    else
        # Auto-update handoff docs if significant change and not in CI
        if [[ "$impact" == "high" || "$impact" == "critical" ]]; then
            auto_update_handoff_docs "$change_type" "$description" "$files"
        fi
        echo "[AUTO-HEALING] Change logged: $change_type - $description"
    fi
}

#######################################
# Log an outcome (GitHub Actions compatible)
#######################################
auto_log_outcome() {
    local success="$1"
    local metrics="$2"
    local lessons="$3"
    
    local outcome_entry="{
        \"timestamp\": \"$(date -Iseconds)\",
        \"success\": $success,
        \"metrics\": $metrics,
        \"lessons\": \"$lessons\",
        \"process\": \"$(basename "$0")\",
        \"session_id\": \"auto-${PROCESS_START_TIME}\"
    }"
    
    PROCESS_OUTCOMES+=("$outcome_entry")
    PROCESS_LESSONS+=("$lessons")
    
    echo "[AUTO-HEALING] Outcome logged: Success=$success"
}

#######################################
# Update handoff docs (GitHub Actions safe)
#######################################
auto_update_handoff_docs() {
    local change_type="$1"
    local description="$2"
    local files="$3"
    local timestamp="$(date -Iseconds)"
    
    if [[ "$AUTO_HEALING_ENABLED" != "true" || "$GITHUB_ACTIONS" == "true" ]]; then
        echo "[AUTO-HEALING] Handoff update skipped (CI mode or disabled)"
        return 0
    fi
    
    # Only update if files are writable
    if [[ -f "HANDOFF-SUMMARY.md" && -w "HANDOFF-SUMMARY.md" ]]; then
        local temp_file=$(mktemp)
        {
            echo "### **🔄 Auto-Update: $timestamp**"
            echo "- **Type**: $change_type"
            echo "- **Change**: $description"
            echo "- **Files**: $files"
            echo "- **Process**: $(basename "$0")"
            echo ""
            cat "HANDOFF-SUMMARY.md"
        } > "$temp_file"
        
        if mv "$temp_file" "HANDOFF-SUMMARY.md" 2>/dev/null; then
            echo "[AUTO-HEALING] Handoff docs updated automatically"
        else
            rm -f "$temp_file"
            echo "[AUTO-HEALING] Handoff update failed (permissions)"
        fi
    fi
}

#######################################
# Log completion (GitHub Actions compatible)
#######################################
auto_log_completion() {
    local process_name="$1"
    local exit_code="$2"
    local context="$3"
    local end_time=$(date +%s)
    local duration=$((end_time - PROCESS_START_TIME))
    
    if [[ "$AUTO_HEALING_ENABLED" != "true" ]]; then
        return 0
    fi
    
    # Create session log in appropriate directory
    local log_file="$WISDOM_ENGINE_LOG_DIR/auto-session-${PROCESS_START_TIME}.json"
    local session_log="{
        \"sessionId\": \"auto-${PROCESS_START_TIME}\",
        \"timestamp\": \"$(date -Iseconds)\",
        \"process\": \"$process_name\",
        \"duration\": $duration,
        \"exitCode\": $exit_code,
        \"success\": $([ "$exit_code" == "0" ] && echo "true" || echo "false"),
        \"context\": \"$context\",
        \"environment\": \"$([ "$GITHUB_ACTIONS" == "true" ] && echo "github-actions" || echo "local")\",
        \"changes\": [$(IFS=,; echo "${PROCESS_CHANGES[*]}")],
        \"outcomes\": [$(IFS=,; echo "${PROCESS_OUTCOMES[*]}")],
        \"lessons\": [$(printf '"%s",' "${PROCESS_LESSONS[@]}" | sed 's/,$//')]
    }"
    
    if echo "$session_log" > "$log_file" 2>/dev/null; then
        echo "[AUTO-HEALING] Session logged: $log_file"
    else
        echo "[AUTO-HEALING] Session logging failed (using stdout): $session_log"
    fi
    
    # Auto-suggest improvements if process failed
    if [[ "$exit_code" != "0" ]]; then
        auto_suggest_improvements "Process failed with exit code $exit_code"
    fi
}

#######################################
# Suggest improvements (GitHub Actions safe)
#######################################
auto_suggest_improvements() {
    local context="$1"
    
    if [[ "$AUTO_HEALING_ENABLED" != "true" ]]; then
        return 0
    fi
    
    echo "[AUTO-HEALING] Improvement suggestions for: $context"
    
    # Pattern-based suggestions (just log in CI)
    if [[ "$context" =~ "failed" ]]; then
        echo "  - Add more robust error handling"
        echo "  - Implement retry mechanisms"
        echo "  - Add pre-validation checks"
    fi
    
    if [[ "${#PROCESS_CHANGES[@]}" -gt 5 ]]; then
        echo "  - Consider breaking this process into smaller components"
        echo "  - Add progress tracking for long-running processes"
    fi
}

#######################################
# Validate compliance (GitHub Actions compatible)
#######################################
validate_auto_healing_compliance() {
    local issues=()
    
    # Check if process is logging changes
    if [[ "${#PROCESS_CHANGES[@]}" -eq 0 ]]; then
        # In CI, this is acceptable - just running validation
        if [[ "$GITHUB_ACTIONS" != "true" ]]; then
            issues+=("No changes logged - use auto_log_change() for significant modifications")
        fi
    fi
    
    # Check if handoff docs exist (but don't require recent updates in CI)
    for doc in "${HANDOFF_DOCS[@]}"; do
        if [[ ! -f "$doc" ]]; then
            issues+=("Missing handoff documentation: $doc")
        elif [[ "$GITHUB_ACTIONS" != "true" && $(find "$doc" -mtime +1 2>/dev/null) ]]; then
            issues+=("Handoff documentation outdated: $doc (>24h old)")
        fi
    done
    
    # Check if directories exist (allow fallback in CI)
    if [[ ! -d "$WISDOM_ENGINE_LOG_DIR" && ! -d "/tmp/collaboration-sessions" ]]; then
        issues+=("Community Wisdom Engine logging directory missing")
    fi
    
    # Report issues
    if [[ "${#issues[@]}" -gt 0 ]]; then
        echo "[AUTO-HEALING] ⚠️ Compliance issues found:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
        
        # In CI, warnings don't fail the build
        if [[ "$GITHUB_ACTIONS" == "true" ]]; then
            echo "[AUTO-HEALING] ✅ CI compliance check completed with warnings"
            return 0
        else
            return 1
        fi
    else
        echo "[AUTO-HEALING] ✅ Compliance validated"
        return 0
    fi
}

#######################################
# Set up trap for auto-logging on exit
#######################################
setup_auto_healing_trap() {
    trap 'auto_log_completion "$(basename "$0")" "$?" "Process completed"' EXIT
}

# Initialize auto-healing for this process
if [[ "$AUTO_HEALING_ENABLED" == "true" ]]; then
    echo "[AUTO-HEALING] Initialized for process: $(basename "$0") ($([ "$GITHUB_ACTIONS" == "true" ] && echo "CI mode" || echo "local mode"))"
    setup_auto_healing_trap
fi
