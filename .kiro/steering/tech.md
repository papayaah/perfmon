---
inclusion: always
---

# Technology Stack

## Frontend

- **Framework**: Preact 10.x (lightweight React alternative)
- **Build Tool**: Vite 5.x with @preact/preset-vite
- **Styling**: Tailwind CSS 3.x with PostCSS
- **Icons**: lucide-preact
- **Storage**: IndexedDB via idb library
- **Routing**: preact-iso for client-side routing

## Backend

- **Runtime**: Node.js with ES modules
- **Server**: Express.js
- **Analysis**: Lighthouse 13.x with chrome-launcher
- **CORS**: Enabled for local development and production
- **Queue Management**: Custom RequestQueue class for concurrent request handling
- **Statistics**: File-based persistence (stats.json) - ephemeral on DigitalOcean without database

## Desktop (Optional)

- **Framework**: Tauri 2.x (Rust-based)
- **Target**: Cross-platform desktop application

## Common Commands

### Development
```bash
npm run dev              # Start both server and client
npm run dev:client       # Start Vite dev server only (port 5173)
npm run dev:server       # Start Lighthouse API server (auto port 3001+)
```

### Production
```bash
npm run build           # Build for web deployment
npm run preview         # Preview production build
npm start               # Run production server
```

### Tauri Desktop
```bash
npm run tauri:dev       # Run desktop app in dev mode
npm run tauri:build     # Build desktop app for distribution
npm run tauri:icons     # Generate app icons from SVG
```

## Deployment

- **Platform**: DigitalOcean App Platform
- **Frontend**: Static site deployment (Vite build output)
- **Backend**: Dockerized Node.js service
- **Container**: Debian-based with Chromium pre-installed
- **Configuration**: `.do/app.yaml` for App Platform settings

## Queue System

- **Concurrency Control**: Configurable via `MAX_CONCURRENT_ANALYSES` env var (default: 1)
- **Queue Size**: Configurable via `MAX_QUEUE_SIZE` env var (default: 10)
- **Timeout**: Configurable via `QUEUE_TIMEOUT_MS` env var (default: 120000ms)
- **Behavior**: Queue resets on deployment/restart (in-flight requests are lost)
- **Status Endpoints**: 
  - `/api/queue-stats` - Current queue state + global statistics
  - `/api/queue-position/:requestId` - Individual request position
  - `/api/stats` - Global statistics only

## Statistics Persistence

- **Storage**: `server/stats.json` file (local development)
- **Tracked Metrics**:
  - `totalAnalyses` - Successfully completed analyses
  - `totalRequests` - All requests including failures
  - `lastUpdated` - Last update timestamp
- **Production Limitation**: File-based storage is ephemeral on DigitalOcean
- **Recommended Solution**: Migrate to PostgreSQL or Redis for production persistence

## Architecture Notes

### Local Development
- Server auto-detects available ports starting from 3001 and writes to `.server-port` file
- Vite proxy reads `.server-port` to configure API proxy at `/api`
- User data stored client-side in IndexedDB (personal history)
- Global stats stored in `server/stats.json` (persists across restarts)
- Lighthouse runs in headless Chrome for each analysis
- CSS custom properties used for theming (see `src/index.css`)

### Production (DigitalOcean)
- Frontend served as static files from CDN
- Backend runs in Docker container with Chromium
- CORS configured via `ALLOWED_ORIGINS` environment variable
- Health checks at `/health` and `/api/health` endpoints
- Queue system handles concurrent requests
- Stats counter resets on each deployment (unless database is added)
