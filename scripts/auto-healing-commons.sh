#!/bin/bash
# Auto-Healing Commons - Core automation functions for self-healing standards
# Source this file in ALL scripts to ensure automatic excellence processes

# Configuration
AUTO_HEALING_ENABLED=${AUTO_HEALING_ENABLED:-true}
WISDOM_ENGINE_LOG_DIR="logs/collaboration-sessions"
HANDOFF_DOCS=("HANDOFF-SUMMARY.md" "QUICK-HANDOFF-STATUS.md")

# Ensure required directories exist
mkdir -p "$WISDOM_ENGINE_LOG_DIR"
mkdir -p "logs/auto-healing"

# Global variables for session tracking
PROCESS_START_TIME=$(date +%s)
PROCESS_CHANGES=()
PROCESS_OUTCOMES=()
PROCESS_LESSONS=()

#######################################
# Log a change made during the process
# Arguments:
#   $1: Change type (feature|fix|docs|test|refactor)
#   $2: Description
#   $3: Impact level (low|medium|high|critical)
#   $4: Files affected (comma-separated)
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
    
    # Auto-update handoff docs if significant change
    if [[ "$impact" == "high" || "$impact" == "critical" ]]; then
        auto_update_handoff_docs "$change_type" "$description" "$files"
    fi
    
    echo "[AUTO-HEALING] Change logged: $change_type - $description"
}

#######################################
# Log an outcome from the process
# Arguments:
#   $1: Success (true|false)
#   $2: Metrics JSON string
#   $3: Lessons learned
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
# Automatically update handoff documentation
# Arguments:
#   $1: Change type
#   $2: Description  
#   $3: Files affected
#######################################
auto_update_handoff_docs() {
    local change_type="$1"
    local description="$2"
    local files="$3"
    local timestamp="$(date -Iseconds)"
    
    if [[ "$AUTO_HEALING_ENABLED" != "true" ]]; then
        return 0
    fi
    
    # Update HANDOFF-SUMMARY.md
    if [[ -f "HANDOFF-SUMMARY.md" ]]; then
        # Insert new change at the top of the latest session section
        local temp_file=$(mktemp)
        {
            # Add new change entry
            echo "### **🔄 Auto-Update: $timestamp**"
            echo "- **Type**: $change_type"
            echo "- **Change**: $description"
            echo "- **Files**: $files"
            echo "- **Process**: $(basename "$0")"
            echo ""
            
            # Add existing content
            cat "HANDOFF-SUMMARY.md"
        } > "$temp_file"
        
        mv "$temp_file" "HANDOFF-SUMMARY.md"
    fi
    
    # Update QUICK-HANDOFF-STATUS.md timestamp
    if [[ -f "QUICK-HANDOFF-STATUS.md" ]]; then
        sed -i.bak "s/Last Updated: .*/Last Updated: $timestamp/" "QUICK-HANDOFF-STATUS.md"
        rm -f "QUICK-HANDOFF-STATUS.md.bak" 2>/dev/null
    fi
    
    echo "[AUTO-HEALING] Handoff docs updated automatically"
}

#######################################
# Log complete session to Community Wisdom Engine
# Arguments:
#   $1: Process name
#   $2: Exit code
#   $3: Additional context
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
    
    # Create comprehensive session log
    local session_log="{
        \"sessionId\": \"auto-${PROCESS_START_TIME}\",
        \"timestamp\": \"$(date -Iseconds)\",
        \"process\": \"$process_name\",
        \"duration\": $duration,
        \"exitCode\": $exit_code,
        \"success\": $([ "$exit_code" == "0" ] && echo "true" || echo "false"),
        \"context\": \"$context\",
        \"changes\": [$(IFS=,; echo "${PROCESS_CHANGES[*]}")],
        \"outcomes\": [$(IFS=,; echo "${PROCESS_OUTCOMES[*]}")],
        \"lessons\": [$(printf '\"%s\",' "${PROCESS_LESSONS[@]}" | sed 's/,$//')]
    }"
    
    # Save to Community Wisdom Engine
    local log_file="$WISDOM_ENGINE_LOG_DIR/auto-session-${PROCESS_START_TIME}.json"
    echo "$session_log" > "$log_file"
    
    # Create human-readable summary
    local summary_file="$WISDOM_ENGINE_LOG_DIR/auto-session-${PROCESS_START_TIME}-summary.md"
    {
        echo "# Auto-Generated Session Summary"
        echo "**Process**: $process_name"
        echo "**Duration**: ${duration}s"
        echo "**Success**: $([ "$exit_code" == "0" ] && echo "✅ Yes" || echo "❌ No")"
        echo "**Changes**: ${#PROCESS_CHANGES[@]}"
        echo "**Outcomes**: ${#PROCESS_OUTCOMES[@]}"
        echo ""
        echo "## Changes Made"
        for change in "${PROCESS_CHANGES[@]}"; do
            echo "- $change"
        done
        echo ""
        echo "## Lessons Learned"
        for lesson in "${PROCESS_LESSONS[@]}"; do
            echo "- $lesson"
        done
    } > "$summary_file"
    
    echo "[AUTO-HEALING] Session logged to Community Wisdom Engine: $log_file"
    
    # Auto-suggest improvements if process failed
    if [[ "$exit_code" != "0" ]]; then
        auto_suggest_improvements "Process failed with exit code $exit_code"
    fi
}

#######################################
# Automatically suggest improvements based on patterns
# Arguments:
#   $1: Context for suggestions
#######################################
auto_suggest_improvements() {
    local context="$1"
    local suggestions_file="logs/auto-healing/improvement-suggestions-$(date +%Y%m%d).md"
    
    if [[ "$AUTO_HEALING_ENABLED" != "true" ]]; then
        return 0
    fi
    
    # Analyze patterns and suggest improvements
    {
        echo "## Auto-Generated Improvement Suggestion - $(date -Iseconds)"
        echo "**Context**: $context"
        echo "**Process**: $(basename "$0")"
        echo ""
        echo "### Suggested Improvements"
        
        # Pattern-based suggestions
        if [[ "$context" =~ "failed" ]]; then
            echo "- Add more robust error handling"
            echo "- Implement retry mechanisms"
            echo "- Add pre-validation checks"
        fi
        
        if [[ "${#PROCESS_CHANGES[@]}" -gt 5 ]]; then
            echo "- Consider breaking this process into smaller components"
            echo "- Add progress tracking for long-running processes"
        fi
        
        if [[ "${#PROCESS_LESSONS[@]}" -eq 0 ]]; then
            echo "- Add lesson capture mechanisms to this process"
            echo "- Implement outcome tracking for learning"
        fi
        
        echo ""
        echo "---"
        echo ""
    } >> "$suggestions_file"
    
    echo "[AUTO-HEALING] Improvement suggestions logged: $suggestions_file"
}

#######################################
# Validate auto-healing compliance for current process
#######################################
validate_auto_healing_compliance() {
    local issues=()
    
    # Check if process is logging changes
    if [[ "${#PROCESS_CHANGES[@]}" -eq 0 ]]; then
        issues+=("No changes logged - use auto_log_change() for significant modifications")
    fi
    
    # Check if handoff docs exist and are recent
    for doc in "${HANDOFF_DOCS[@]}"; do
        if [[ ! -f "$doc" ]]; then
            issues+=("Missing handoff documentation: $doc")
        elif [[ $(find "$doc" -mtime +1 2>/dev/null) ]]; then
            issues+=("Handoff documentation outdated: $doc (>24h old)")
        fi
    done
    
    # Check if Community Wisdom logging is set up
    if [[ ! -d "$WISDOM_ENGINE_LOG_DIR" ]]; then
        issues+=("Community Wisdom Engine logging directory missing")
    fi
    
    # Report issues
    if [[ "${#issues[@]}" -gt 0 ]]; then
        echo "[AUTO-HEALING] ⚠️ Compliance issues found:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
        return 1
    else
        echo "[AUTO-HEALING] ✅ Compliance validated"
        return 0
    fi
}

#######################################
# Set up trap to ensure auto-logging on script exit
#######################################
setup_auto_healing_trap() {
    trap 'auto_log_completion "$(basename "$0")" "$?" "Process completed"' EXIT
}

# Initialize auto-healing for this process
if [[ "$AUTO_HEALING_ENABLED" == "true" ]]; then
    echo "[AUTO-HEALING] Initialized for process: $(basename "$0")"
    setup_auto_healing_trap
fi