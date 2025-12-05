import express from 'express';
import cors from 'cors';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { createServer } from 'net';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { RequestQueue } from './queue.js';
import { statsTracker } from './stats.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Initialize request queue with environment variables
const MAX_CONCURRENT_ANALYSES = parseInt(process.env.MAX_CONCURRENT_ANALYSES) || 1;
const MAX_QUEUE_SIZE = parseInt(process.env.MAX_QUEUE_SIZE) || 10;
const QUEUE_TIMEOUT_MS = parseInt(process.env.QUEUE_TIMEOUT_MS) || 120000;

const requestQueue = new RequestQueue(MAX_CONCURRENT_ANALYSES, MAX_QUEUE_SIZE);

console.log(`Request queue initialized: maxConcurrent=${MAX_CONCURRENT_ANALYSES}, maxQueueSize=${MAX_QUEUE_SIZE}, timeout=${QUEUE_TIMEOUT_MS}ms`);

// Initialize stats tracker
await statsTracker.init();

// Find an available port starting from the preferred port
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

// Write port to a file so Vite can read it
function writePortFile(port) {
  const portFilePath = join(__dirname, '..', '.server-port');
  writeFileSync(portFilePath, String(port));
  console.log(`Server port written to ${portFilePath}`);
}

app.use(cors());
app.use(express.json());

// Health check endpoint for DigitalOcean
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Queue statistics endpoint
app.get('/api/queue-stats', (req, res) => {
  const queueStats = requestQueue.getStats();
  const globalStats = statsTracker.getStats();
  res.json({
    ...queueStats,
    totalAnalyses: globalStats.totalAnalyses,
    totalRequests: globalStats.totalRequests
  });
});

// Global statistics endpoint
app.get('/api/stats', (req, res) => {
  const stats = statsTracker.getStats();
  res.json(stats);
});

// Queue position endpoint
app.get('/api/queue-position/:requestId', (req, res) => {
  const { requestId } = req.params;
  
  const position = requestQueue.getRequestPosition(requestId);
  
  if (!position) {
    return res.status(404).json({ 
      error: 'Request not found',
      message: 'The specified request ID was not found in the queue or may have already completed.'
    });
  }
  
  res.json(position);
});

app.post('/api/analyze', async (req, res) => {
  const { url, deviceType = 'desktop' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!['mobile', 'desktop'].includes(deviceType)) {
    return res.status(400).json({ error: 'deviceType must be "mobile" or "desktop"' });
  }

  // Increment total requests counter
  await statsTracker.incrementRequests();

  try {
    console.log(`[Queue] Request received for ${url} (${deviceType}). Current queue: ${requestQueue.getStats().activeCount} active, ${requestQueue.getStats().queueLength} waiting`);
    
    // Wrap the analysis logic in queue.add()
    const { result, requestId } = await requestQueue.add(async () => {
      let chrome;
      try {
        console.log(`Starting ${deviceType} analysis for: ${url}`);
        
        chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
        
        // Use the appropriate config based on device type
        // For desktop, we use the desktop preset
        // For mobile, we use the default (which is mobile)
        
        let config;
        
        if (deviceType === 'desktop') {
          // Load desktop config
          const desktopConfig = await import('lighthouse/core/config/desktop-config.js');
          config = desktopConfig.default;
        } else {
          // Load default config (mobile)
          const defaultConfig = await import('lighthouse/core/config/default-config.js');
          config = defaultConfig.default;
        }
        
        // Deep clone to avoid mutating the imported config
        config = JSON.parse(JSON.stringify(config));
        
        // Apply our specific settings
        config.settings = {
          ...config.settings,
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          // Ensure we capture the full page screenshot for our thumbnail fallback
          disableFullPageScreenshot: false,
        };
        
        const options = {
          logLevel: 'info',
          output: 'json',
          port: chrome.port,
        };
        
        const runnerResult = await lighthouse(url, options, config);
        const report = JSON.parse(runnerResult.report);

        const scores = {
          performance: report.categories.performance ? report.categories.performance.score * 100 : 0,
          accessibility: report.categories.accessibility ? report.categories.accessibility.score * 100 : 0,
          bestPractices: report.categories['best-practices'] ? report.categories['best-practices'].score * 100 : 0,
          seo: report.categories.seo ? report.categories.seo.score * 100 : 0,
        };

        // Extract audit details for each category
        const extractAudits = (categoryId) => {
          if (!report.categories[categoryId] || !report.categories[categoryId].auditRefs) {
            console.log(`No auditRefs found for category: ${categoryId}`);
            return [];
          }
          
          const refs = report.categories[categoryId].auditRefs;
          console.log(`Category ${categoryId}: processing ${refs.length} refs`);

          const results = refs.map(ref => {
              const audit = report.audits[ref.id];
              if (!audit) return null;
              
              // Log scores for debugging
              if (audit.score !== 1 && audit.score !== null) {
                 console.log(`[${categoryId}] Found issue: ${audit.id}, score: ${audit.score}`);
              } else if (audit.score === null && !['notApplicable', 'informative'].includes(audit.scoreDisplayMode)) {
                 console.log(`[${categoryId}] Found potential issue (null score): ${audit.id}, mode: ${audit.scoreDisplayMode}`);
              }

              // Filter out passed audits (score 1)
              if (audit.score === 1) return null;
              
              // Filter out informational/notApplicable audits
              if (audit.score === null) {
                 if (['notApplicable', 'informative'].includes(audit.scoreDisplayMode)) {
                   return null;
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
                warnings: audit.warnings,
              };
            })
            .filter(audit => audit !== null);
            
          console.log(`Category ${categoryId}: found ${results.length} issues`);
          
          return results.sort((a, b) => {
              if (a.score !== null && b.score !== null) return a.score - b.score;
              if (a.score === null) return 1;
              if (b.score === null) return -1;
              return a.title.localeCompare(b.title);
            });
        };

        const audits = {
          performance: extractAudits('performance'),
          accessibility: extractAudits('accessibility'),
          bestPractices: extractAudits('best-practices'), // Note: category ID is 'best-practices' but we use camelCase in response
          seo: extractAudits('seo'),
        };
        
        // Log summary
        console.log('Audits summary:', {
          performance: audits.performance.length,
          accessibility: audits.accessibility.length,
          bestPractices: audits.bestPractices.length,
          seo: audits.seo.length,
        });

        // Extract screenshot thumbnail from the report
        // Lighthouse includes final-screenshot audit by default
        let thumbnail = null;
        
        try {
          // Try final-screenshot audit first (Lighthouse default)
          if (report.audits && report.audits['final-screenshot']) {
            const finalScreenshot = report.audits['final-screenshot'];
            if (finalScreenshot.details && finalScreenshot.details.type === 'screenshot') {
              const screenshotData = finalScreenshot.details.data;
              if (screenshotData) {
                // Lighthouse provides base64 data, ensure it has data URI prefix
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
          
          // Alternative: Check audits for full-page-screenshot
          if (!thumbnail && report.audits && report.audits['full-page-screenshot']) {
            const fullPage = report.audits['full-page-screenshot'];
            if (fullPage.details && fullPage.details.screenshot && fullPage.details.screenshot.data) {
              const screenshotData = fullPage.details.screenshot.data;
              thumbnail = screenshotData.startsWith('data:') ? screenshotData : `data:image/png;base64,${screenshotData}`;
            }
          }
        } catch (screenshotError) {
          console.warn('Could not extract screenshot:', screenshotError.message);
          // Screenshot is optional - continue without it
        }

        console.log(`${deviceType} analysis complete`, scores);
        
        return { 
          url, 
          deviceType,
          timestamp: new Date().toISOString(),
          scores,
          thumbnail,
          audits 
        };

      } catch (error) {
        console.error('Lighthouse error:', error);
        throw error;
      } finally {
        if (chrome) {
          await chrome.kill();
        }
      }
    }, QUEUE_TIMEOUT_MS);

    // Increment successful analyses counter
    await statsTracker.incrementAnalyses();

    // Send successful result with requestId
    res.json({ ...result, requestId });

  } catch (error) {
    // Handle queue full errors with 429 status
    if (error.message === 'Queue is full') {
      console.warn('Queue is full, rejecting request');
      return res.status(429).json({ 
        error: 'Too many requests', 
        message: 'The analysis queue is currently full. Please try again later.',
        queueStats: requestQueue.getStats()
      });
    }

    // Handle timeout errors with 408 status
    if (error.message === 'Request timeout') {
      console.warn('Request timed out in queue');
      return res.status(408).json({ 
        error: 'Request timeout', 
        message: 'The analysis request timed out. Please try again.',
        timeout: QUEUE_TIMEOUT_MS
      });
    }

    // Handle other errors with 500 status
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to run Lighthouse', 
      details: error.message 
    });
  }
});

// Start server with auto port detection
(async () => {
  try {
    // Use PORT env var for production (DigitalOcean), fallback to auto-detect for local dev
    const port = process.env.PORT || await findAvailablePort(3001);
    
    // Only write port file in development
    if (!process.env.PORT) {
      writePortFile(port);
    }
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`Lighthouse runner listening at http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();

