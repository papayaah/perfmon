# PerfMon

A modern, high-performance Lighthouse analysis tool built with Preact and Vite.

## Features
- **Lighthouse Integration**: Runs full Lighthouse analysis on any URL.
- **History Tracking**: Saves all analysis reports locally using IndexedDB.
- **Desktop App**: Optional Tauri desktop app for macOS, Windows, and Linux.
- **Perfect Score Architecture**: Built with performance and accessibility in mind.
- **Modern UI**: Clean, dark-mode interface using Tailwind CSS.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app (runs both server and client):
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser.

## Usage

1. Enter a URL (e.g., `localhost:3000` or `https://example.com`) in the search box.
2. Click the search button to start analysis.
3. View the results and history below.

## Desktop App

Build the Tauri desktop app:
```bash
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/`

