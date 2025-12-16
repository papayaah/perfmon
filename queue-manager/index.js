import express from 'express';
import cors from 'cors';
import dns from 'dns';
import { promisify } from 'util';

const app = express();
const PORT = process.env.PORT || 8080;
const WORKER_SERVICE = process.env.WORKER_SERVICE || 'worker';
const WORKER_PORT = process.env.WORKER_PORT || 8080;

// Dynamic worker discovery
let workers = [];
const workerStatus = new Map(); // workerIp -> { busy: boolean, currentJob: object|null }

// Queue and state
const jobQueue = [];
let totalAnalyses = 0;

app.use(cors());
app.use(express.json());

// Discover workers via DNS (Docker internal DNS)
async function discoverWorkers() {
  try {
    const lookup = promisify(dns.lookup);
    const resolve = promisify(dns.resolve4);

    // Try to resolve all IPs for the worker service
    const ips = await resolve(WORKER_SERVICE).catch(() => []);

    if (ips.length === 0) {
      // Fallback: try single lookup
      const result = await lookup(WORKER_SERVICE).catch(() => null);
      if (result && result.address) {
        return [{ id: 1, ip: result.address, url: `http://${result.address}:${WORKER_PORT}` }];
      }
      return [];
    }

    return ips.map((ip, index) => ({
      id: index + 1,
      ip: ip,
      url: `http://${ip}:${WORKER_PORT}`
    }));
  } catch (error) {
    console.error('[Queue] Worker discovery failed:', error.message);
    return [];
  }
}

// Initialize/refresh workers
async function refreshWorkers() {
  const discovered = await discoverWorkers();

  if (discovered.length > 0) {
    // Add new workers
    for (const w of discovered) {
      if (!workers.find(existing => existing.ip === w.ip)) {
        workers.push(w);
        workerStatus.set(w.ip, { busy: false, currentJob: null });
        console.log(`[Queue] Discovered worker ${w.id}: ${w.url}`);
      }
    }

    // Remove workers that no longer exist
    const discoveredIps = new Set(discovered.map(w => w.ip));
    workers = workers.filter(w => {
      if (!discoveredIps.has(w.ip)) {
        workerStatus.delete(w.ip);
        console.log(`[Queue] Worker ${w.id} (${w.ip}) removed`);
        return false;
      }
      return true;
    });

    // Re-number workers
    workers.forEach((w, i) => w.id = i + 1);
  }

  return workers;
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'queue-manager',
    workers: workers.length,
    queueLength: jobQueue.length
  });
});

// Queue stats endpoint - this is what the frontend polls
app.get('/api/queue-stats', (req, res) => {
  const activeCount = Array.from(workerStatus.values()).filter(w => w.busy).length;

  res.json({
    queueLength: jobQueue.length,
    activeCount: activeCount,
    maxConcurrent: workers.length,
    totalAnalyses: totalAnalyses,
    workers: workers.map(w => ({
      id: w.id,
      busy: workerStatus.get(w.ip)?.busy || false,
      currentJob: workerStatus.get(w.ip)?.currentJob || null
    }))
  });
});

// Main analyze endpoint - accepts requests and queues them
app.post('/api/analyze', async (req, res) => {
  const { url, deviceType = 'desktop' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!['mobile', 'desktop'].includes(deviceType)) {
    return res.status(400).json({ error: 'deviceType must be "mobile" or "desktop"' });
  }

  // Refresh worker list
  await refreshWorkers();

  if (workers.length === 0) {
    return res.status(503).json({
      error: 'No workers available',
      message: 'No Lighthouse workers are currently available. Please try again later.'
    });
  }

  // Create job
  const job = {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    deviceType,
    createdAt: new Date().toISOString(),
    status: 'queued'
  };

  // Try to find an available worker immediately
  const availableWorker = findAvailableWorker();

  if (availableWorker) {
    // Worker available - process immediately
    console.log(`[Queue] Job ${job.id} assigned to Worker ${availableWorker.id} immediately`);
    try {
      const result = await processJob(job, availableWorker);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Analysis failed',
        details: error.message,
        jobId: job.id
      });
    }
  } else {
    // All workers busy - add to queue and wait
    console.log(`[Queue] All workers busy, job ${job.id} added to queue (position ${jobQueue.length + 1})`);

    // Add to queue with response callback
    const jobPromise = new Promise((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
      job.res = res;
      jobQueue.push(job);
    });

    // Set timeout for queued jobs (5 minutes max wait)
    const timeout = setTimeout(() => {
      const index = jobQueue.findIndex(j => j.id === job.id);
      if (index !== -1) {
        jobQueue.splice(index, 1);
        if (!res.headersSent) {
          res.status(504).json({
            error: 'Queue timeout',
            message: 'Request timed out waiting in queue',
            jobId: job.id
          });
        }
      }
    }, 300000);

    job.timeout = timeout;

    try {
      const result = await jobPromise;
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Analysis failed',
          details: error.message,
          jobId: job.id
        });
      }
    }
  }
});

// Find an available worker
function findAvailableWorker() {
  for (const worker of workers) {
    const status = workerStatus.get(worker.ip);
    if (status && !status.busy) {
      return worker;
    }
  }
  return null;
}

// Process a job on a specific worker
async function processJob(job, worker) {
  // Mark worker as busy
  workerStatus.set(worker.ip, {
    busy: true,
    currentJob: {
      id: job.id,
      url: job.url,
      deviceType: job.deviceType,
      startedAt: new Date().toISOString()
    }
  });

  console.log(`[Queue] Processing job ${job.id} on Worker ${worker.id}: ${job.url} (${job.deviceType})`);

  try {
    const response = await fetch(`${worker.url}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: job.url, deviceType: job.deviceType }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || `Worker returned ${response.status}`);
    }

    const result = await response.json();
    totalAnalyses++;

    console.log(`[Queue] Job ${job.id} completed on Worker ${worker.id}`);

    return {
      ...result,
      queueStats: {
        jobId: job.id,
        workerId: worker.id,
        queuedAt: job.createdAt,
        completedAt: new Date().toISOString()
      }
    };

  } finally {
    // Mark worker as available
    workerStatus.set(worker.ip, { busy: false, currentJob: null });

    // Process next job in queue if any
    processNextInQueue();
  }
}

// Process next job in queue
async function processNextInQueue() {
  if (jobQueue.length === 0) return;

  const availableWorker = findAvailableWorker();
  if (!availableWorker) return;

  const job = jobQueue.shift();
  if (!job) return;

  console.log(`[Queue] Dequeued job ${job.id}, assigning to Worker ${availableWorker.id} (${jobQueue.length} remaining)`);

  try {
    const result = await processJob(job, availableWorker);
    if (job.resolve) {
      job.resolve(result);
    }
  } catch (error) {
    console.error(`[Queue] Job ${job.id} failed:`, error.message);
    if (job.reject) {
      job.reject(error);
    }
  }
}

// Check worker health and sync status
async function checkWorkerHealth() {
  await refreshWorkers();

  for (const worker of workers) {
    try {
      const response = await fetch(`${worker.url}/health`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const health = await response.json();
        const currentStatus = workerStatus.get(worker.ip);

        if (currentStatus && !currentStatus.busy && health.busy) {
          workerStatus.set(worker.ip, {
            busy: true,
            currentJob: health.currentAnalysis || null
          });
        } else if (currentStatus && currentStatus.busy && !health.busy) {
          workerStatus.set(worker.ip, { busy: false, currentJob: null });
          processNextInQueue();
        }
      }
    } catch (e) {
      console.warn(`[Queue] Worker ${worker.id} health check failed:`, e.message);
    }
  }
}

// Check worker health every 10 seconds
setInterval(checkWorkerHealth, 10000);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[Queue] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Queue] Unhandled Rejection:', reason);
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Queue Manager listening at http://0.0.0.0:${PORT}`);

  // Initial worker discovery
  await refreshWorkers();
  console.log(`📊 Discovered ${workers.length} workers`);

  // Start health checks after a delay
  setTimeout(checkWorkerHealth, 5000);
});
