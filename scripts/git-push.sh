#!/usr/bin/env bash
# Push the current branch using GITHUB_TOKEN from .env.git (never printed).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.git"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.git.example to .env.git and add GITHUB_TOKEN."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN is empty in .env.git"
  exit 1
fi

REMOTE_URL="$(git -C "$ROOT" remote get-url origin)"
# https://github.com/owner/repo.git → owner/repo
REPO_PATH="${REMOTE_URL#https://github.com/}"
REPO_PATH="${REPO_PATH%.git}"
BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)"

if [[ -n "${GIT_USER_NAME:-}" ]]; then
  export GIT_AUTHOR_NAME="$GIT_USER_NAME"
  export GIT_COMMITTER_NAME="$GIT_USER_NAME"
fi
if [[ -n "${GIT_USER_EMAIL:-}" ]]; then
  export GIT_AUTHOR_EMAIL="$GIT_USER_EMAIL"
  export GIT_COMMITTER_EMAIL="$GIT_USER_EMAIL"
fi

git -C "$ROOT" push "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO_PATH}.git" "HEAD:${BRANCH}"
