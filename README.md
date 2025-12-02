# PerfMon

A modern, high-performance Lighthouse analysis tool built with Preact and Vite.

🌐 **Live Demo**: [perfmon.vercel.app](https://perfmon.vercel.app)

## Features
- **Lighthouse Integration**: Runs full Lighthouse analysis on any URL.
- **History Tracking**: Saves all analysis reports locally using IndexedDB.
- **Serverless API**: Lighthouse runs on Vercel Functions with Playwright.
- **Desktop App**: Optional Tauri desktop app for macOS, Windows, and Linux.
- **Perfect Score Architecture**: Built with performance and accessibility in mind.
- **Modern UI**: Clean, dark-mode interface using Tailwind CSS.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server (runs Lighthouse):
   ```bash
   npm run server
   ```

3. In a separate terminal, start the frontend:
   ```bash
   npm run dev
   ```

4. Open the URL shown in the frontend terminal (usually http://localhost:5173).

## Usage

1. Enter a URL (e.g., `localhost:3000` or `https://example.com`) in the search box.
2. Click the search button to start analysis.
3. View the results and history below.

## Deployment

**Production URL**: https://perfmon.vercel.app

The app is deployed on Vercel with:
- Frontend: Static Vite build
- API: Serverless function at `/api/analyze` using Playwright + Lighthouse

To deploy:
```bash
vercel --prod
```

## Desktop App

Build the Tauri desktop app:
```bash
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/`

