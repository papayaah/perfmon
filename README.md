# PerfMon

A modern, high-performance Lighthouse analysis tool built with Preact and Vite.

## Features
- **Lighthouse Integration**: Runs full Lighthouse analysis on any URL.
- **History Tracking**: Saves all analysis reports locally using IndexedDB.
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

