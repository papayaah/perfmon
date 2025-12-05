---
inclusion: always
---

# Project Structure

## Root Configuration

- `package.json` - Dependencies and npm scripts
- `vite.config.js` - Vite build config with API proxy setup
- `tailwind.config.js` - Tailwind CSS configuration with dark mode
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer
- `index.html` - Entry HTML file
- `.server-port` - Generated file containing active server port
- `Dockerfile` - Docker container configuration for production deployment
- `.do/app.yaml` - DigitalOcean App Platform deployment configuration
- `.dockerignore` - Files to exclude from Docker builds

## Source Code (`src/`)

- `main.jsx` - Application entry point with landing/app routing
- `app.jsx` - Main application component with analysis UI
- `db.js` - IndexedDB wrapper functions (add/get/delete reports)
- `index.css` - Global styles and CSS custom properties for theming

### Components (`src/components/`)

- `LandingPage.jsx` - Initial landing page with feature showcase
- `ScoreCard.jsx` - Reusable score display component
- `ThemeToggle.jsx` - Dark/light/system theme switcher

## Backend (`server/`)

- `index.js` - Express server that runs Lighthouse analyses
  - Auto port detection (3001+) in development
  - POST `/api/analyze` endpoint with queue integration
  - GET `/api/queue-stats` endpoint for queue status
  - GET `/api/queue-position/:requestId` endpoint for request tracking
  - GET `/api/stats` endpoint for global statistics
  - GET `/api/health` health check endpoints
  - Handles mobile/desktop device emulation
  - Returns scores, audits, and screenshot thumbnails
- `queue.js` - RequestQueue class for managing concurrent analyses
  - Limits concurrent Chrome instances
  - Queues excess requests with timeout handling
  - Tracks request positions and estimated wait times
- `stats.js` - StatsTracker class for persistent statistics
  - Tracks total analyses and requests
  - Persists to `stats.json` file
  - Auto-initializes on server start
- `stats.json` - Persistent statistics storage (gitignored, local only)
- `STATS_PERSISTENCE.md` - Documentation for statistics system

## Tauri Desktop (`src-tauri/`)

- `tauri.conf.json` - Tauri app configuration
- `Cargo.toml` - Rust dependencies
- `src/main.rs` - Rust entry point
- `src/lib.rs` - Tauri command handlers
- `icons/` - Application icons for all platforms

## Build Output

- `dist/` - Vite production build output
- `.vite/` - Vite cache and dependencies
- `src-tauri/target/` - Rust/Tauri build artifacts

## Conventions

- Use `.jsx` extension for Preact components
- ES modules throughout (type: "module" in package.json)
- Functional components with hooks (no class components)
- Tailwind utility classes for styling
- CSS custom properties for theme colors
- camelCase for JavaScript, kebab-case for CSS classes
