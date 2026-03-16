#!/bin/bash
set -e

CURRENT=$(node -p "require('./package.json').version")
MAJOR=$(echo "$CURRENT" | cut -d. -f1)
MINOR=$(echo "$CURRENT" | cut -d. -f2)
PATCH=$(echo "$CURRENT" | cut -d. -f3)
VERSION="$MAJOR.$MINOR.$((PATCH + 1))"

echo "Current version: $CURRENT"
echo "New version: $VERSION"

npm version "$VERSION" --no-git-tag-version

git add package.json
git commit -m "bump version to $VERSION"
git push

git tag "$VERSION"
git push origin "$VERSION"

echo "Released $VERSION successfully!"
