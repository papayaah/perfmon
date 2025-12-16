import express from 'express';
import cors from 'cors';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { createServer } from 'net';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Worker ID for Docker deployments (optional for local)
const WORKER_ID = process.env.WORKER_ID || 'local';
const IS_DOCKER = process.env.WORKER_ID !== undefined;

// Track if worker is currently busy (for Docker queue manager)
let isBusy = false;
let currentAnalysis = null;

console.log(`🚀 Lighthouse Server ${WORKER_ID} starting...`);

// Find an available port starting from the preferred port (local dev only)
async function findAvailablePort(startPort = 3001, maxAttempts = 10) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const isAvailable = await new Promise((resolve) => {
      const server = createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
    if (isAvailable) return port;
  }
  throw new Error(`No available port found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

// Write port to a file so Vite can read it (local dev only)
function writePortFile(port) {
  const portFilePath = join(__dirname, '..', '.server-port');
  writeFileSync(portFilePath, String(port));
  console.log(`Server port written to ${portFilePath}`);
}

// Validate and normalize URL
function validateAndNormalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  // Trim whitespace
  url = url.trim();

  // If URL doesn't start with http:// or https://, add https://
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Validate URL format
  try {
    const urlObj = new URL(url);
    
    // Ensure we have a valid protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('URL must use http:// or https:// protocol');
    }

    // Ensure we have a hostname
    if (!urlObj.hostname) {
      throw new Error('URL must have a valid hostname');
    }

    return urlObj.href;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    throw error;
  }
}

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    workerId: WORKER_ID,
    busy: isBusy,
    currentAnalysis: currentAnalysis,
    timestamp: new Date().toISOString()
  });
});

// Worker status endpoint (for Docker queue manager)
app.get('/status', (req, res) => {
  res.json({
    workerId: WORKER_ID,
    busy: isBusy,
    currentAnalysis: currentAnalysis,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { url: rawUrl, deviceType = 'desktop' } = req.body;

  if (!rawUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!['mobile', 'desktop'].includes(deviceType)) {
    return res.status(400).json({ error: 'deviceType must be "mobile" or "desktop"' });
  }

  // Validate and normalize URL
  let url;
  try {
    url = validateAndNormalizeUrl(rawUrl);
  } catch (error) {
    return res.status(400).json({ 
      error: 'Invalid URL',
      details: error.message,
      hint: 'URL must include a protocol (http:// or https://) or be a valid domain name'
    });
  }

  // Reject if already busy (Docker mode - queue manager handles queuing)
  if (IS_DOCKER && isBusy) {
    return res.status(503).json({
      error: 'Worker busy',
      message: `Worker ${WORKER_ID} is currently processing another analysis`,
      workerId: WORKER_ID,
      currentAnalysis: currentAnalysis
    });
  }

  // Mark as busy
  isBusy = true;
  currentAnalysis = { url, deviceType, startTime: new Date().toISOString() };

  let chrome;
  try {
    console.log(`[${WORKER_ID}] Starting ${deviceType} analysis for: ${url}`);

    // Chrome flags - optimized for both local and Docker
    // IMPORTANT: Do NOT use --single-process or --no-zygote as they break the DevTools websocket
    const chromeFlags = [
      '--headless=new',                    // Use new headless mode (more stable)
      '--no-sandbox',                      // Required for Docker
      '--disable-gpu',                     // No GPU in container
      '--disable-dev-shm-usage',           // Use /tmp instead of /dev/shm
      '--disable-setuid-sandbox',          // Required for Docker
      '--no-first-run',                    // Skip first run wizard
      '--disable-extensions',              // No extensions needed
      '--disable-background-networking',   // Reduce network overhead
      '--disable-default-apps',            // No default apps
      '--disable-sync',                    // No sync
      '--disable-translate',               // No translate
      '--mute-audio',                      // No audio
      '--hide-scrollbars',                 // Cleaner screenshots
      '--metrics-recording-only',          // Minimal metrics
      '--safebrowsing-disable-auto-update', // No safe browsing updates
      '--disable-blink-features=AutomationControlled', // Hide automation flag
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ];

    chrome = await chromeLauncher.launch({
      chromeFlags,
      handleSIGINT: false,
      chromePath: process.env.CHROME_PATH,
      connectionPollInterval: 500,
      maxConnectionRetries: 50,
      logLevel: 'info'
    });

    console.log(`[${WORKER_ID}] Chrome launched on port ${chrome.port}`);

    // Small delay to ensure Chrome is fully ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Configure Lighthouse based on device type
    let config;

    if (deviceType === 'desktop') {
      const desktopConfig = await import('lighthouse/core/config/desktop-config.js');
      config = desktopConfig.default;
    } else {
      const defaultConfig = await import('lighthouse/core/config/default-config.js');
      config = defaultConfig.default;
    }

    // Deep clone to avoid mutating the imported config
    config = JSON.parse(JSON.stringify(config));

    // Apply our specific settings
    config.settings = {
      ...config.settings,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      disableFullPageScreenshot: false,
    };

    const options = {
      logLevel: 'info',
      output: 'json',
      port: chrome.port,
    };

    // Run Lighthouse with timeout
    const lighthouseTimeout = 90000; // 90 seconds max
    const runnerResult = await Promise.race([
      lighthouse(url, options, config),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Lighthouse execution timeout')), lighthouseTimeout)
      )
    ]);

    const report = JSON.parse(runnerResult.report);

    // Check for runtime errors (e.g., page couldn't be loaded)
    const runtimeError = report.runtimeError;
    if (runtimeError) {
      console.error(`[${WORKER_ID}] Lighthouse runtime error:`, runtimeError);
      throw new Error(`Page load failed: ${runtimeError.message || runtimeError.code || 'ERRORED_DOCUMENT_REQUEST'}`);
    }

    // If all scores are null/0, the page likely didn't load
    const allScoresZero = !report.categories.performance?.score
      && !report.categories.accessibility?.score
      && !report.categories['best-practices']?.score
      && !report.categories.seo?.score;

    if (allScoresZero) {
      console.error(`[${WORKER_ID}] All scores are zero - page may have blocked the request`);
      throw new Error('Page could not be analyzed. The site may be blocking requests from this server, or the URL may be invalid.');
    }

    // Extract scores
    const scores = {
      performance: report.categories.performance ? report.categories.performance.score * 100 : 0,
      accessibility: report.categories.accessibility ? report.categories.accessibility.score * 100 : 0,
      bestPractices: report.categories['best-practices'] ? report.categories['best-practices'].score * 100 : 0,
      seo: report.categories.seo ? report.categories.seo.score * 100 : 0,
    };

    // Extract audits
    const extractAudits = (categoryId) => {
      if (!report.categories[categoryId] || !report.categories[categoryId].auditRefs) {
        return [];
      }

      return report.categories[categoryId].auditRefs
        .map(ref => {
          const audit = report.audits[ref.id];
          if (!audit) return null;

          // Filter out passed audits (score 1)
          if (audit.score === 1) return null;

          // Filter out informational/notApplicable audits
          if (audit.score === null) {
            if (['notApplicable', 'informative'].includes(audit.scoreDisplayMode)) {
              return null;
            }
          }

          // Filter out hidden groups
          if (ref.group === 'hidden') return null;

          // Get group from auditRef with fallback inference
          let group = ref.group;
          if (!group) {
            if (audit.scoreDisplayMode === 'numeric' || audit.scoreDisplayMode === 'metricSavings') {
              group = 'metrics';
            } else if (audit.details && audit.details.type === 'opportunity') {
              group = 'diagnostics';
            } else {
              group = 'other';
            }
          }

          return {
            id: ref.id,
            title: audit.title,
            description: audit.description,
            score: audit.score !== null ? audit.score * 100 : null,
            scoreDisplayMode: audit.scoreDisplayMode,
            displayValue: audit.displayValue,
            details: audit.details,
            group: group
          };
        })
        .filter(audit => audit !== null)
        .sort((a, b) => {
          if (a.score !== null && b.score !== null) return a.score - b.score;
          if (a.score === null) return 1;
          if (b.score === null) return -1;
          return a.title.localeCompare(b.title);
        });
    };

    const audits = {
      performance: extractAudits('performance'),
      accessibility: extractAudits('accessibility'),
      bestPractices: extractAudits('best-practices'),
      seo: extractAudits('seo'),
    };

    // Extract screenshot thumbnail
    let thumbnail = null;
    try {
      if (report.audits && report.audits['final-screenshot']) {
        const finalScreenshot = report.audits['final-screenshot'];
        if (finalScreenshot.details && finalScreenshot.details.type === 'screenshot') {
          const screenshotData = finalScreenshot.details.data;
          if (screenshotData) {
            thumbnail = screenshotData.startsWith('data:') ? screenshotData : `data:image/jpeg;base64,${screenshotData}`;
          }
        }
      }

      // Fallback: Try full-page-screenshot
      if (!thumbnail && report.fullPageScreenshot && report.fullPageScreenshot.screenshot) {
        const screenshotData = report.fullPageScreenshot.screenshot.data;
        if (screenshotData) {
          thumbnail = screenshotData.startsWith('data:') ? screenshotData : `data:image/png;base64,${screenshotData}`;
        }
      }
    } catch (screenshotError) {
      console.warn(`[${WORKER_ID}] Could not extract screenshot:`, screenshotError.message);
    }

    console.log(`[${WORKER_ID}] ${deviceType} analysis complete`, scores);

    const result = {
      url,
      deviceType,
      timestamp: new Date().toISOString(),
      workerId: WORKER_ID,
      scores,
      thumbnail,
      audits
    };

    res.json(result);

  } catch (error) {
    console.error(`[${WORKER_ID}] Lighthouse error:`, error);
    res.status(500).json({
      error: 'Failed to run Lighthouse',
      details: error.message,
      workerId: WORKER_ID
    });
  } finally {
    // Always cleanup Chrome
    if (chrome) {
      try {
        console.log(`[${WORKER_ID}] Cleaning up Chrome process ${chrome.pid}`);
        await chrome.kill();
        console.log(`[${WORKER_ID}] Chrome process killed successfully`);

        // Cleanup delay
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (killError) {
        console.error(`[${WORKER_ID}] Error killing Chrome:`, killError);
        try {
          if (chrome.pid) {
            process.kill(chrome.pid, 'SIGKILL');
            console.log(`[${WORKER_ID}] Chrome force killed with SIGKILL`);
          }
        } catch (forceKillError) {
          console.error(`[${WORKER_ID}] Error force killing Chrome:`, forceKillError);
        }
      }
    }

    // Mark as available
    isBusy = false;
    currentAnalysis = null;
  }
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error(`[${WORKER_ID}] Uncaught Exception:`, error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${WORKER_ID}] Unhandled Rejection:`, reason);
});

// Start server
(async () => {
  try {
    // Use PORT env var for Docker, fallback to auto-detect for local dev
    const port = process.env.PORT || await findAvailablePort(3001);

    // Only write port file in local development
    if (!process.env.PORT) {
      writePortFile(port);
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Lighthouse Server ${WORKER_ID} listening at http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();
