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
- **CORS**: Enabled for local development

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

## Architecture Notes

- Server auto-detects available ports starting from 3001 and writes to `.server-port` file
- Vite proxy reads `.server-port` to configure API proxy at `/api`
- All data stored client-side in IndexedDB (no persistent backend database)
- Lighthouse runs in headless Chrome for each analysis
- CSS custom properties used for theming (see `src/index.css`)
