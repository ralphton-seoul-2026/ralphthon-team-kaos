#!/bin/bash
# Chaos Lab — 원클릭 설치 스크립트

set -e

echo "🧪 Chaos Lab 설치를 시작합니다..."

# 1. 빌드
echo "📦 의존성 설치 및 빌드..."
npm install
npm run build

echo "✅ 빌드 완료"

# 2. Ouroboros 설치 (Deep Mode 의존성)
echo "🐍 Ouroboros 설치 중..."
if command -v claude &> /dev/null; then
  claude plugin marketplace add Q00/ouroboros 2>/dev/null && \
  claude plugin install ouroboros@ouroboros 2>/dev/null || \
  echo "⚠️ Ouroboros 설치 건너뜀 (이미 설치되었거나 마켓플레이스 접근 불가)"
else
  echo "⚠️ Claude CLI가 설치되지 않아 Ouroboros 설치를 건너뜁니다"
fi

# 3. Claude Code 스킬 등록
echo "🔧 스킬 등록 중..."
SKILL_DIR="$HOME/.claude/skills/chaos-lab"
mkdir -p "$SKILL_DIR"
cp skill/SKILL.md "$SKILL_DIR/SKILL.md"
echo "✅ 스킬 등록 완료: $SKILL_DIR"

echo ""
echo "🎉 Chaos Lab 설치가 완료되었습니다!"
echo ""
echo "사용법:"
echo '  /chaos-lab "밤새 크롤링 돌려도 되나?"'
echo '  node dist/cli/index.js --quick "작업 설명"'
