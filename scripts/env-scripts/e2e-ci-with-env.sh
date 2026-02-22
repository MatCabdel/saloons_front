source "$(dirname "$0")/../utils.sh"

validate_env "$1" "staging|production"

echo_separator
echo_green "✨ Running e2e:ci tests for environment: $1"
echo_separator

# Skip gracefully when no E2E specs are present.
if ! find cypress/e2e -type f \( -name "*.cy.js" -o -name "*.cy.jsx" -o -name "*.cy.ts" -o -name "*.cy.tsx" \) 2>/dev/null | grep -q .; then
    echo_yellow "⚠️ No Cypress E2E specs found in cypress/e2e, skipping e2e:ci."
    exit 0
fi

start-server-and-test \
    "npm run build --env=$1 && npm run start-server" \
    http://localhost:4200 \
    cypress:run
