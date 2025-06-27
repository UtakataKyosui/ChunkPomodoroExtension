#!/bin/bash

# CI Monitor and Auto-Fix Script
# Monitors GitHub Actions runs and automatically fixes common build issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="UtakataKyosui"
REPO_NAME="ChunkPomodoroExtension"
BRANCH_NAME="build-to-zipfile-release"
MAX_RETRIES=5
RETRY_COUNT=0

echo -e "${BLUE}🔍 Starting CI Monitor for ${REPO_OWNER}/${REPO_NAME}...${NC}"

# Function to get the latest workflow run for our branch
get_latest_run() {
    gh run list \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --branch "${BRANCH_NAME}" \
        --limit 1 \
        --json conclusion,status,databaseId,headBranch,workflowName \
        --jq '.[0]'
}

# Function to get workflow run logs
get_run_logs() {
    local run_id=$1
    echo -e "${YELLOW}📋 Fetching logs for run ${run_id}...${NC}"
    
    gh run view "${run_id}" \
        --repo "${REPO_OWNER}/${REPO_NAME}" \
        --log \
        2>/dev/null || echo "Failed to fetch logs"
}

# Function to analyze logs and suggest fixes
analyze_and_fix() {
    local logs="$1"
    local fixes_applied=false
    
    echo -e "${YELLOW}🔍 Analyzing logs for common issues...${NC}"
    
    # Check for TailwindCSS PostCSS error
    if echo "$logs" | grep -q "tailwindcss.*PostCSS plugin"; then
        echo -e "${RED}❌ Found TailwindCSS PostCSS plugin error${NC}"
        fix_tailwindcss_postcss
        fixes_applied=true
    fi
    
    # Check for missing tsconfig.json
    if echo "$logs" | grep -q "ENOENT.*tsconfig.json"; then
        echo -e "${RED}❌ Found missing tsconfig.json error${NC}"
        fix_missing_tsconfig
        fixes_applied=true
    fi
    
    # Check for icon/asset errors
    if echo "$logs" | grep -q "No icon found\|Failed to resolve.*icon\|icon.*plasmo"; then
        echo -e "${RED}❌ Found icon/asset error${NC}"
        fix_icon_issues
        fixes_applied=true
    fi
    
    # Check for manifest errors
    if echo "$logs" | grep -q "Invalid Web Extension manifest\|manifest.*error"; then
        echo -e "${RED}❌ Found manifest error${NC}"
        fix_manifest_issues
        fixes_applied=true
    fi
    
    # Check for dependency/package errors
    if echo "$logs" | grep -q "npm ERR!\|Cannot resolve\|Module not found"; then
        echo -e "${RED}❌ Found dependency error${NC}"
        fix_dependency_issues
        fixes_applied=true
    fi
    
    # Check for build/compilation errors
    if echo "$logs" | grep -q "TypeScript error\|Compilation failed\|Build failed"; then
        echo -e "${RED}❌ Found compilation error${NC}"
        fix_compilation_issues
        fixes_applied=true
    fi
    
    return $([ "$fixes_applied" = true ] && echo 0 || echo 1)
}

# Fix functions
fix_tailwindcss_postcss() {
    echo -e "${BLUE}🔧 Fixing TailwindCSS PostCSS configuration...${NC}"
    
    # Add @tailwindcss/postcss if not present
    if ! grep -q "@tailwindcss/postcss" package.json; then
        npm install --save-dev @tailwindcss/postcss
    fi
    
    # Update postcss.config.js
    cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
EOF
    
    echo -e "${GREEN}✅ TailwindCSS PostCSS configuration fixed${NC}"
}

fix_missing_tsconfig() {
    echo -e "${BLUE}🔧 Creating missing tsconfig.json...${NC}"
    
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "~*": ["./*"],
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx"
  ],
  "exclude": [
    "node_modules",
    "build",
    ".plasmo"
  ]
}
EOF
    
    echo -e "${GREEN}✅ tsconfig.json created${NC}"
}

fix_icon_issues() {
    echo -e "${BLUE}🔧 Fixing icon issues...${NC}"
    
    mkdir -p assets
    
    # Create a simple SVG icon
    cat > assets/icon.svg << 'EOF'
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#FF6B6B" stroke="#FFFFFF" stroke-width="4"/>
  <circle cx="64" cy="64" r="44" fill="#FFFFFF" stroke="#333333" stroke-width="2"/>
  <line x1="64" y1="64" x2="64" y2="30" stroke="#333333" stroke-width="3" stroke-linecap="round"/>
  <line x1="64" y1="64" x2="92" y2="64" stroke="#333333" stroke-width="2" stroke-linecap="round"/>
  <circle cx="64" cy="64" r="3" fill="#333333"/>
</svg>
EOF
    
    echo -e "${GREEN}✅ Icon assets created${NC}"
}

fix_manifest_issues() {
    echo -e "${BLUE}🔧 Fixing manifest issues...${NC}"
    
    # Create .plasmorc if it doesn't exist
    cat > .plasmorc << 'EOF'
{
  "manifest": {
    "permissions": [
      "storage",
      "notifications", 
      "alarms"
    ]
  },
  "browser": "chrome"
}
EOF
    
    echo -e "${GREEN}✅ Manifest configuration fixed${NC}"
}

fix_dependency_issues() {
    echo -e "${BLUE}🔧 Fixing dependency issues...${NC}"
    
    # Clean install
    rm -rf node_modules package-lock.json
    npm install
    
    echo -e "${GREEN}✅ Dependencies reinstalled${NC}"
}

fix_compilation_issues() {
    echo -e "${BLUE}🔧 Fixing compilation issues...${NC}"
    
    # Add missing type definitions
    npm install --save-dev @types/chrome @types/react @types/react-dom
    
    echo -e "${GREEN}✅ Type definitions updated${NC}"
}

# Function to commit and push fixes
commit_fixes() {
    echo -e "${BLUE}💾 Committing fixes...${NC}"
    
    git add .
    git commit -m "fix: auto-fix CI build issues (attempt $((RETRY_COUNT + 1)))

- Automatically detected and fixed build errors
- Applied fixes for common CI/CD issues
- Generated by CI monitor script

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "No changes to commit"
    
    git push origin "${BRANCH_NAME}"
    
    echo -e "${GREEN}✅ Fixes pushed to ${BRANCH_NAME}${NC}"
}

# Function to wait for workflow completion
wait_for_completion() {
    local run_id=$1
    local timeout=300  # 5 minutes
    local elapsed=0
    
    echo -e "${YELLOW}⏳ Waiting for workflow to complete...${NC}"
    
    while [ $elapsed -lt $timeout ]; do
        local run_info=$(gh run view "${run_id}" --repo "${REPO_OWNER}/${REPO_NAME}" --json status,conclusion)
        local status=$(echo "$run_info" | jq -r '.status')
        local conclusion=$(echo "$run_info" | jq -r '.conclusion')
        
        if [ "$status" = "completed" ]; then
            echo -e "${BLUE}🏁 Workflow completed with conclusion: ${conclusion}${NC}"
            return $([ "$conclusion" = "success" ] && echo 0 || echo 1)
        fi
        
        sleep 10
        elapsed=$((elapsed + 10))
        printf "."
    done
    
    echo -e "\n${RED}⏰ Timeout waiting for workflow completion${NC}"
    return 1
}

# Main monitoring loop
main() {
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo -e "\n${BLUE}🔄 Attempt $((RETRY_COUNT + 1))/${MAX_RETRIES}${NC}"
        
        # Get latest run
        local run_info=$(get_latest_run)
        local run_id=$(echo "$run_info" | jq -r '.databaseId')
        local status=$(echo "$run_info" | jq -r '.status')
        local conclusion=$(echo "$run_info" | jq -r '.conclusion')
        local workflow_name=$(echo "$run_info" | jq -r '.workflowName')
        
        echo -e "${BLUE}📊 Latest run: ${run_id} (${workflow_name})${NC}"
        echo -e "${BLUE}📊 Status: ${status}, Conclusion: ${conclusion}${NC}"
        
        if [ "$conclusion" = "success" ]; then
            echo -e "${GREEN}🎉 Build successful! Monitoring complete.${NC}"
            exit 0
        elif [ "$conclusion" = "failure" ]; then
            echo -e "${RED}❌ Build failed. Analyzing logs...${NC}"
            
            # Get logs and analyze
            local logs=$(get_run_logs "$run_id")
            
            if analyze_and_fix "$logs"; then
                echo -e "${YELLOW}🔧 Fixes applied. Committing and retrying...${NC}"
                commit_fixes
                
                # Wait a bit before checking the new run
                sleep 30
                RETRY_COUNT=$((RETRY_COUNT + 1))
            else
                echo -e "${RED}❌ No automatic fixes available for this error${NC}"
                echo -e "${YELLOW}📋 Please review the logs manually:${NC}"
                echo "$logs" | tail -50
                exit 1
            fi
        elif [ "$status" = "in_progress" ] || [ "$status" = "queued" ]; then
            if ! wait_for_completion "$run_id"; then
                echo -e "${RED}❌ Workflow failed or timed out${NC}"
                RETRY_COUNT=$((RETRY_COUNT + 1))
            fi
        else
            echo -e "${YELLOW}⚠️  Unknown status: ${status}/${conclusion}${NC}"
            sleep 30
        fi
    done
    
    echo -e "${RED}❌ Maximum retries exceeded. Please check manually.${NC}"
    exit 1
}

# Run the main function
main "$@"