# チャンクポモドーロセッター (Chunk Pomodoro Setter)

A Chrome extension that implements time management using 2-hour chunks combined with the Pomodoro technique.

## Setup

This project uses the Plasmo framework for Chrome extension development.

### Prerequisites

- Node.js 18.17.0+ or 20.3.0+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Then load the extension in Chrome:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `build/chrome-mv3-dev` folder

### Building

```bash
npm run build
```

### Packaging

```bash
npm run package
```

## Features

- **Chunk Management**: 2-hour time blocks (configurable 30min-4hr)
- **Pomodoro Integration**: Traditional 25/5min work/break cycles
- **Task Organization**: Complete tasks within defined chunks
- **Modern Tech Stack**: React + TypeScript + Plasmo

## Project Structure

- `popup.tsx` - Main popup interface
- `options.tsx` - Settings/configuration page
- `background.ts` - Service worker for timers and notifications
- `assets/` - Icons and static assets
