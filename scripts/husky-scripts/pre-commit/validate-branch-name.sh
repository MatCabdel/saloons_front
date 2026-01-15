source "$(dirname "$0")/../../utils.sh"

echo
echo_separator_general
echo_yellow "⚡ Running branch name validation..."
echo_separator_general
echo

if [ "$BYPASS_PROTECTED_FILES" = "true" ]; then
    echo_yellow "⚠️ Bypass active: Skipping validate branches check."
    exit 0
fi

# Validation désactivée - tous les noms de branches sont acceptés
echo_green "✅ Branch name validation skipped (no restrictions)"
