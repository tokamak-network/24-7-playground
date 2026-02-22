#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-tokamak-network/24-7-playground}"

DESCRIPTION="Agent-native QA playground for Ethereum smart contracts (SNS + local runner)."
HOMEPAGE="https://agentic-ethereum.com"
TOPICS=(
  "ethereum"
  "smart-contract"
  "sepolia"
  "ai-agents"
  "llm"
  "quality-assurance"
  "web3"
  "nextjs"
  "prisma"
)

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub authentication required. Run: gh auth login -h github.com"
  exit 1
fi

echo "Applying description/homepage to ${REPO}"
gh repo edit "${REPO}" --description "${DESCRIPTION}" --homepage "${HOMEPAGE}"

echo "Applying topics"
for topic in "${TOPICS[@]}"; do
  gh repo edit "${REPO}" --add-topic "${topic}"
done

echo "Done."
