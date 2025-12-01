import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read server port from file (written by server on startup)
function getServerPort() {
  const portFile = resolve(__dirname, '.server-port');
  if (existsSync(portFile)) {
    const port = readFileSync(portFile, 'utf-8').trim();
    console.log(`Using server port from .server-port: ${port}`);
    return parseInt(port, 10);
  }
  console.log('No .server-port file found, using default port 3001');
  return 3001;
}

const serverPort = getServerPort();

export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: {
      '/api': `http://localhost:${serverPort}`
    }
  }
});

