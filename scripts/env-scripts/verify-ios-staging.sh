#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "----------------------------------------------"
echo "Saloons iOS staging verification"
echo "----------------------------------------------"

MAIN_DIST="$ROOT_DIR/dist/frontend/browser/main.js"
MAIN_IOS="$ROOT_DIR/ios/App/App/public/main.js"

if [[ -f "$MAIN_DIST" ]]; then
  echo "✅ Build output found: dist/frontend/browser/main.js"
else
  echo "⚠️  Build output not found. Run: npm run build:staging"
fi

if [[ -f "$MAIN_IOS" ]]; then
  echo "✅ iOS public assets found: ios/App/App/public/main.js"
else
  echo "⚠️  iOS public assets not found. Run: npx cap sync ios"
fi

check_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    return 0
  fi

  if command -v rg >/dev/null 2>&1; then
    if rg -q "staging-api\\.saloons\\.fr" "$file"; then
      echo "✅ staging-api.saloons.fr present in $file"
    else
      echo "❌ staging-api.saloons.fr NOT found in $file"
    fi

    if rg -q "localhost:8080|http://localhost" "$file"; then
      echo "❌ localhost reference found in $file"
    else
      echo "✅ no localhost reference in $file"
    fi
  else
    if grep -q "staging-api.saloons.fr" "$file"; then
      echo "✅ staging-api.saloons.fr present in $file"
    else
      echo "❌ staging-api.saloons.fr NOT found in $file"
    fi

    if grep -Eq "localhost:8080|http://localhost" "$file"; then
      echo "❌ localhost reference found in $file"
    else
      echo "✅ no localhost reference in $file"
    fi
  fi
}

check_file "$MAIN_DIST"
check_file "$MAIN_IOS"

echo "----------------------------------------------"
echo "Next steps:"
echo "- npm run build:staging"
echo "- npx cap sync ios"
echo "- Re-open Xcode, clean build folder, archive"
echo "----------------------------------------------"
