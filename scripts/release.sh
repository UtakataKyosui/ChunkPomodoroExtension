#!/bin/bash

# Release script for Chrome Extension
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default version bump type
VERSION_TYPE=${1:-patch}

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Invalid version type. Use 'patch', 'minor', or 'major'${NC}"
    exit 1
fi

echo -e "${YELLOW}🚀 Starting release process...${NC}"

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo -e "${RED}Error: Must be on main branch to release${NC}"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Error: Working directory is not clean${NC}"
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin main

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Run tests if available
echo -e "${YELLOW}🧪 Running tests...${NC}"
if npm run test --if-present; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  No tests found${NC}"
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}📋 Current version: ${CURRENT_VERSION}${NC}"

# Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $VERSION_TYPE in
    major)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        ;;
    minor)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        ;;
    patch)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        ;;
esac

echo -e "${YELLOW}🔄 Bumping version to: ${NEW_VERSION}${NC}"

# Update package.json version
npm version $NEW_VERSION --no-git-tag-version

# Build the extension
echo -e "${YELLOW}🏗️  Building extension...${NC}"
npm run build

# Package the extension
echo -e "${YELLOW}📦 Packaging extension...${NC}"
npm run package

# Find the generated package
PACKAGE_PATH=$(find build -name "*.zip" -type f | head -1)
if [[ -z "$PACKAGE_PATH" ]]; then
    echo -e "${RED}Error: No package found after build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Package created: ${PACKAGE_PATH}${NC}"

# Generate changelog
echo -e "${YELLOW}📝 Generating changelog...${NC}"
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [[ -z "$LAST_TAG" ]]; then
    COMMITS=$(git log --pretty=format:"- %s (%h)" --reverse)
else
    COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"- %s (%h)" --reverse)
fi

# Create release notes
RELEASE_NOTES="## チャンクポモドーロセッター v${NEW_VERSION}

### What's Changed
${COMMITS}

### Installation
1. Download the extension package
2. Open Chrome and go to chrome://extensions/
3. Enable \"Developer mode\" in the top right
4. Drag and drop the downloaded file or use \"Load unpacked\" after extracting

### Chrome Web Store
This extension will be available on the Chrome Web Store soon."

echo -e "${YELLOW}📝 Release notes:${NC}"
echo "$RELEASE_NOTES"

# Commit version bump
echo -e "${YELLOW}💾 Committing version bump...${NC}"
git add package.json package-lock.json
git commit -m "chore: bump version to v${NEW_VERSION}"

# Create git tag
echo -e "${YELLOW}🏷️  Creating Git tag...${NC}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

# Push changes and tag
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"

# Create GitHub release (if gh CLI is available)
if command -v gh &> /dev/null; then
    echo -e "${YELLOW}🎉 Creating GitHub release...${NC}"
    
    # Save release notes to temporary file
    TEMP_NOTES=$(mktemp)
    echo "$RELEASE_NOTES" > "$TEMP_NOTES"
    
    # Create release
    gh release create "v${NEW_VERSION}" \
        --title "チャンクポモドーロセッター v${NEW_VERSION}" \
        --notes-file "$TEMP_NOTES" \
        "$PACKAGE_PATH"
    
    # Clean up
    rm "$TEMP_NOTES"
    
    echo -e "${GREEN}✅ GitHub release created successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  GitHub CLI not found. Please create the release manually:${NC}"
    echo -e "${YELLOW}   1. Go to: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/new${NC}"
    echo -e "${YELLOW}   2. Tag: v${NEW_VERSION}${NC}"
    echo -e "${YELLOW}   3. Upload: ${PACKAGE_PATH}${NC}"
fi

echo -e "${GREEN}🎉 Release v${NEW_VERSION} completed successfully!${NC}"
echo -e "${GREEN}📦 Package: ${PACKAGE_PATH}${NC}"
echo -e "${GREEN}🏷️  Tag: v${NEW_VERSION}${NC}"