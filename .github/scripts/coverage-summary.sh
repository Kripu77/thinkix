#!/bin/bash
set -euo pipefail

COVERAGE_FILE="${1:-coverage/coverage-summary.json}"

if [[ ! -f "$COVERAGE_FILE" ]]; then
  echo "coverage_file=$COVERAGE_FILE" >> "$GITHUB_OUTPUT"
  echo "lines=0" >> "$GITHUB_OUTPUT"
  echo "functions=0" >> "$GITHUB_OUTPUT"
  echo "branches=0" >> "$GITHUB_OUTPUT"
  echo "statements=0" >> "$GITHUB_OUTPUT"
  echo "average=0" >> "$GITHUB_OUTPUT"
  exit 0
fi

LINES=$(jq -r '.lines.percentage // 0' "$COVERAGE_FILE")
FUNCTIONS=$(jq -r '.functions.percentage // 0' "$COVERAGE_FILE")
BRANCHES=$(jq -r '.branches.percentage // 0' "$COVERAGE_FILE")
STATEMENTS=$(jq -r '.statements.percentage // 0' "$COVERAGE_FILE")

AVG=$(awk "BEGIN {printf \"%.1f\", ($LINES + $FUNCTIONS + $BRANCHES + $STATEMENTS) / 4}")

{
  echo "coverage_file=$COVERAGE_FILE"
  echo "lines=$LINES"
  echo "functions=$FUNCTIONS"
  echo "branches=$BRANCHES"
  echo "statements=$STATEMENTS"
  echo "average=$AVG"
} >> "$GITHUB_OUTPUT"
