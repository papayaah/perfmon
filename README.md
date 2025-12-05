# PerfMon

Vibe coding makes software engineering faster — just make sure all your apps stay in tip-top shape

![PerfMon Screenshot](screenshot.jpg)

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

## Connect

If you found this tool useful, feel free to connect:

- [LinkedIn](https://www.linkedin.com/in/david-ang-0932bb4a/)
- [X/Twitter](https://x.com/papayaahtries)
- [Reddit](https://www.reddit.com/user/Prize-Coyote-6989/)
- [Devpost](https://devpost.com/software/perfmon)



## DigitalOcean Deployment

### Viewing Logs with doctl

```bash
# List your apps to get the app ID
doctl apps list

# Tail logs for a specific component (replace APP_ID)
doctl apps logs APP_ID --component lighthouse-api --follow

# View recent logs without following
doctl apps logs APP_ID --component lighthouse-api --tail 100
```

### Troubleshooting

If Lighthouse is timing out on DigitalOcean:
- The server now has a 90-second hard timeout for Lighthouse execution
- Chrome is configured with memory-optimized flags for low-resource environments
- Consider upgrading from `basic-xxs` to `basic-xs` or higher in `.do/app.yaml` if issues persist
- Check logs with `doctl apps logs` to see specific error messages
