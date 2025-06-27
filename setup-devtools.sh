#!/bin/bash

# Development Tools Setup Script for Chrome Extension Development
echo "🛠️ Setting up development tools for Chrome Extension..."

# Update package lists
echo "📦 Updating package lists..."
sudo apt-get update >/dev/null 2>&1

# Install essential development tools
echo "🔧 Installing essential tools..."
sudo apt-get install -y \
    tmux \
    fzf \
    tree \
    curl \
    wget \
    git-extras \
    ripgrep \
    fd-find \
    bat \
    exa \
    htop \
    vim \
    nano \
    unzip \
    zip \
    jq \
    >/dev/null 2>&1 || echo "  → Some packages may need manual installation"

# Install npm global packages for Chrome extension development
echo "📦 Installing npm global packages..."
npm install -g \
    plasmo \
    typescript \
    @types/chrome \
    web-ext \
    @aku11i/phantom \
    >/dev/null 2>&1 || echo "  → npm global packages installation pending"

# Setup aliases and shell improvements
echo "🐚 Setting up shell improvements..."
cat >> ~/.bashrc << 'EOF'

# Development tools aliases
alias ll='exa -la --icons'
alias ls='exa --icons'
alias cat='batcat --paging=never'
alias find='fd'
alias grep='rg'
alias top='htop'

# Git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline --graph'

# tmux aliases
alias t='tmux'
alias ta='tmux attach'
alias tl='tmux list-sessions'

# Chrome Extension specific aliases
alias dev='npm run dev'
alias build='npm run build'
alias package='npm run package'
alias test='npm run test'

# Plasmo specific aliases
alias plasmo-dev='plasmo dev'
alias plasmo-build='plasmo build'
alias plasmo-package='plasmo package'

# Claude Code aliases
alias yolo='claude --dangerously-skip-permissions '

# fzf setup
if command -v fzf >/dev/null 2>&1; then
    eval "$(fzf --bash)"
fi
EOF

# Setup tmux configuration
echo "⚙️ Setting up tmux configuration..."
cat > ~/.tmux.conf << 'EOF'
# Basic settings
set -g default-terminal "screen-256color"
set -g history-limit 10000
set -g base-index 1
set -g pane-base-index 1

# Key bindings
bind r source-file ~/.tmux.conf \; display "Config reloaded!"
bind | split-window -h
bind - split-window -v

# Status bar
set -g status-bg black
set -g status-fg white
set -g status-left '[#S] '
set -g status-right '%Y-%m-%d %H:%M'

# Window activity
setw -g monitor-activity on
set -g visual-activity on
EOF

# Create development workspace structure
echo "📁 Setting up development workspace..."
mkdir -p ~/workspace/chrome-extensions
mkdir -p ~/workspace/tools
mkdir -p ~/workspace/logs

# Setup Chrome extension development environment
echo "🌐 Setting up Chrome extension development environment..."
cat >> ~/.bashrc << 'EOF'

# Chrome Extension Development Environment
export CHROME_EXTENSION_DEV=true
export PLASMO_DEBUG=true

# Chrome extension development functions
function chrome-reload() {
    echo "🔄 Reloading Chrome extension..."
    # This would typically trigger a reload in the browser
    # For now, just a placeholder
    echo "Manual reload required in Chrome Extensions page"
}

function chrome-package() {
    echo "📦 Building Chrome extension package..."
    npm run build && npm run package
}

function chrome-lint() {
    echo "🔍 Linting Chrome extension..."
    npm run lint 2>/dev/null || echo "No lint script found"
}

# Project navigation
function goto-project() {
    cd /workspace && echo "📂 Switched to project directory"
}

alias gp='goto-project'
EOF

# Install Chrome extension development tools
echo "🔧 Installing Chrome extension specific tools..."
npm install -g \
    eslint \
    prettier \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin \
    >/dev/null 2>&1 || echo "  → ESLint and Prettier installation pending"

# Setup Chrome extension manifest validation
echo "✅ Setting up manifest validation..."
cat > ~/workspace/tools/validate-manifest.js << 'EOF'
const fs = require('fs');
const path = require('path');

function validateManifest(manifestPath) {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Basic validation
        const required = ['name', 'version', 'manifest_version'];
        const missing = required.filter(key => !manifest[key]);
        
        if (missing.length > 0) {
            console.error('❌ Missing required fields:', missing.join(', '));
            return false;
        }
        
        if (manifest.manifest_version !== 3) {
            console.warn('⚠️ Consider using Manifest V3');
        }
        
        console.log('✅ Manifest validation passed');
        return true;
    } catch (error) {
        console.error('❌ Manifest validation failed:', error.message);
        return false;
    }
}

// Usage: node validate-manifest.js path/to/manifest.json
if (process.argv[2]) {
    validateManifest(process.argv[2]);
} else {
    console.log('Usage: node validate-manifest.js path/to/manifest.json');
}
EOF

chmod +x ~/workspace/tools/validate-manifest.js

# Final setup
echo "🎯 Finalizing setup..."
source ~/.bashrc 2>/dev/null || true

echo "✅ Development tools setup complete!"
echo ""
echo "📋 Available commands:"
echo "  dev          - Start Plasmo development server"
echo "  build        - Build extension for production"
echo "  package      - Package extension for Chrome Web Store"
echo "  chrome-lint  - Lint extension code"
echo "  gp          - Go to project directory"
echo ""
echo "🚀 Ready for Chrome extension development!"
echo "💡 Load the extension in Chrome by going to chrome://extensions/ and enabling Developer mode"