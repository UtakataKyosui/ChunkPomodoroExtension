# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension called "チャンクポモドーロセッター" (Chunk Pomodoro Setter) that implements time management using 2-hour chunks combined with the Pomodoro technique.

### Core Concept
- **Chunk Management**: 2-hour time blocks (user configurable 30min-4hr)
- **Pomodoro Integration**: Traditional 25/5min work/break cycles within chunks
- **Task Organization**: Complete tasks within defined chunks

## Architecture

### Chrome Extension Structure (Manifest V3)
```
/
├── manifest.json          # Extension configuration
├── popup/                 # Extension popup UI
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/               # Settings page
│   ├── options.html
│   ├── options.js
│   └── options.css
├── background/            # Service worker
│   └── background.js
├── content/               # Content scripts (if needed)
├── assets/                # Icons, sounds, images
└── utils/                 # Shared utilities
    ├── storage.js         # Data persistence
    ├── timer.js           # Timer logic
    ├── notifications.js   # Notification system
    └── analytics.js       # Statistics tracking
```

### Data Models

#### Chunk Data Structure
```javascript
{
  id: string,
  startTime: Date,
  duration: number, // minutes (default: 120)
  endTime: Date,
  tasks: Task[],
  pomodoroSessions: PomodoroSession[],
  status: 'active' | 'completed' | 'paused'
}
```

#### Task Data Structure
```javascript
{
  id: string,
  title: string,
  description: string,
  estimatedPomodoros: number,
  priority: 'high' | 'medium' | 'low',
  completed: boolean,
  chunkId: string
}
```

#### Pomodoro Session Data Structure
```javascript
{
  id: string,
  type: 'work' | 'shortBreak' | 'longBreak',
  duration: number, // minutes
  startTime: Date,
  endTime: Date,
  completed: boolean,
  taskId: string | null
}
```

## Development Tasks

### Phase 1: Core Infrastructure
1. **Project Setup**
   - Initialize manifest.json with Manifest V3
   - Set up basic folder structure
   - Configure permissions (storage, notifications, activeTab)

2. **Storage System**
   - Implement chrome.storage.local wrapper
   - Create data models and validation
   - Add data migration system

3. **Timer Engine**
   - Build countdown timer with Service Worker
   - Implement pause/resume functionality
   - Add timer state persistence

### Phase 2: UI Components
1. **Popup Interface**
   - Current chunk status display
   - Pomodoro timer controls
   - Quick task list view
   - Start/stop/pause buttons

2. **Options Page**
   - Chunk duration settings
   - Pomodoro time customization
   - Notification preferences
   - Theme selection

3. **Statistics Dashboard**
   - Daily/weekly/monthly charts
   - Completion rate tracking
   - Productivity score calculation
   - Data export functionality

### Phase 3: Advanced Features
1. **Notification System**
   - Chunk completion alerts
   - Pomodoro transition notifications
   - Desktop notification integration
   - Optional sound alerts

2. **Task Management**
   - Task creation and editing
   - Priority assignment
   - Progress tracking
   - Pomodoro estimation

3. **Analytics & Reporting**
   - Performance metrics
   - Productivity insights
   - Historical data visualization
   - CSV/JSON export

## Development Commands

### Testing
```bash
# Load extension in Chrome for testing
# 1. Open Chrome -> Extensions -> Developer mode
# 2. Load unpacked extension from project directory
# 3. Test popup, options, and background functionality
```

### Build Process
```bash
# No build process needed for basic extension
# Files are loaded directly by Chrome
# For production: minify JS/CSS files
```

## Key Implementation Notes

### Chrome Extension Best Practices
- Use chrome.storage.local for data persistence
- Implement proper error handling for API calls
- Follow Chrome's security policies (no inline scripts)
- Use chrome.alarms API for reliable timing

### Timer Implementation
- Service Worker must handle background timing
- Use chrome.alarms for precise timing
- Store timer state in chrome.storage for persistence
- Handle browser sleep/wake scenarios

### Notification Strategy
- Request notification permissions on first use
- Provide audio/visual notification options
- Respect user's notification preferences
- Handle notification click events

### Data Management
- Implement data validation and sanitization
- Use versioning for data schema changes
- Provide data backup/restore functionality
- Optimize storage usage (chrome.storage has limits)

## UI/UX Guidelines

### Design Principles
- Minimal, distraction-free interface
- Quick access to essential functions
- Clear visual feedback for timer states
- Consistent iconography and color scheme

### Responsive Design
- Optimize for standard popup dimensions (400x600px)
- Support different screen resolutions
- Ensure accessibility compliance
- Test on different Chrome versions

## Testing Strategy

### Manual Testing
- Timer accuracy across different scenarios
- Data persistence after browser restart
- Notification delivery and interaction
- UI responsiveness and usability

### Edge Cases
- Browser sleep/wake cycle handling
- Extension disable/enable scenarios
- Storage quota exceeded situations
- Network connectivity issues

## Localization

### Supported Languages
- Japanese (primary)
- English (secondary)

### Implementation
- Use chrome.i18n API for message management
- Separate locale files for each language
- Support for RTL languages if needed

## Performance Considerations

### Memory Usage
- Minimize background script memory footprint
- Implement proper cleanup for event listeners
- Use efficient data structures for large datasets

### Battery Impact
- Minimize CPU usage in background
- Use efficient timer implementations
- Avoid unnecessary network requests

## Security & Privacy

### Data Protection
- All data stored locally (no external servers)
- No sensitive information tracking
- User consent for notifications
- Secure data validation

### Chrome Security
- Content Security Policy compliance
- No eval() or inline scripts
- Sanitize user input
- Follow Chrome Web Store policies