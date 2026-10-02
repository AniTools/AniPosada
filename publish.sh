#!/bin/bash
# Publishes your latest changes (CMS edits, code, anything) to the live site.
#
# What it does:
#   1. Shows you exactly what changed — added, edited, and deleted files
#   2. Asks you to confirm before doing anything
#   3. Commits everything with a message (today's date by default, or your own)
#   4. Pushes to GitHub, which tells Netlify to rebuild the live site
#
# Usage:
#   ./publish.sh                        (uses today's date as the message)
#   ./publish.sh "Added new project"    (your own message)

cd "$(dirname "$0")" || exit 1

if [ -z "$(git status --porcelain)" ]; then
  echo "Nothing to publish — no changes since your last push."
  exit 0
fi

echo "Changes found:"
git status --short
echo ""

DELETED=$(git status --porcelain | grep -E '^( D|D )' | sed 's/^...//')
if [ -n "$DELETED" ]; then
  echo "⚠️  This will DELETE the following from the live site:"
  echo "$DELETED" | sed 's/^/    /'
  echo ""
fi

read -p "Publish these changes? [y/N] " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Cancelled — nothing was published."
  exit 0
fi

MESSAGE="${1:-Update site content — $(date '+%Y-%m-%d %H:%M')}"

git add -A
git commit -m "$MESSAGE"
git push

echo ""
echo "Published. Netlify will rebuild the live site in a minute or two."
echo "Check progress at: your Netlify dashboard → Deploys"
