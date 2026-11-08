#!/bin/bash
# ----------------------------------------------------------------------
# TAVARDT SEO Guard Action (Bash Runner)
# Description: Automated search regression auditor runner
# Website: https://ag.tavardt.com/
# ----------------------------------------------------------------------

set -e

DIR="${1:-./out}"

if ! command -v node &> /dev/null; then
  echo "🚨 [ERROR] Node.js is required to run TAVARDT SEO Guard."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/guard.js" "$DIR"
