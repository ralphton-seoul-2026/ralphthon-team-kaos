#!/bin/bash
# 전체 시나리오 검증 (Loop 종료 게이트)
# 30개 시나리오 모두 통과해야 exit 0
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

exec node scripts/validate-engine.mjs "$@"
