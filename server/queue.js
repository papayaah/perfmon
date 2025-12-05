/**
 * RequestQueue - Manages concurrent request execution with queuing
 * 
 * This class implements a request queue that limits concurrent executions
 * and queues additional requests when the limit is reached. It includes
 * timeout handling and queue capacity enforcement.
 */
class RequestQueue {
  /**
   * Create a new RequestQueue
   * @param {number} maxConcurrent - Maximum number of concurrent executions (default: 1)
   * @param {number} maxQueueSize - Maximum number of queued requests (default: 10)
   */
  constructor(maxConcurrent = 1, maxQueueSize = 10) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
    this.activeCount = 0;
    this.queue = [];
    this.requestIdCounter = 0;
    this.activeRequests = new Map(); // Track active requests by ID
  }

  /**
   * Generate a unique request ID
   * @returns {string} Unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Add a task to the queue or execute immediately if under concurrency limit
   * @param {Function} task - Async function to execute
   * @param {number} timeoutMs - Timeout in milliseconds (default: 120000)
   * @returns {Promise<{result: any, requestId: string}>} Resolves with task result and requestId
   */
  async add(task, timeoutMs = 120000) {
    const requestId = this.generateRequestId();

    // Check if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Queue is full');
    }

    // If under concurrency limit, execute immediately
    if (this.activeCount < this.maxConcurrent) {
      const result = await this.execute(task, requestId);
      return { result, requestId };
    }

    // Otherwise, queue the task
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Remove from queue on timeout
        const index = this.queue.findIndex(item => item.requestId === requestId);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error('Request timeout'));
      }, timeoutMs);

      this.queue.push({ task, resolve, reject, timeoutId, requestId, queuedAt: Date.now() });
    });
  }

  /**
   * Execute a task and track active count
   * @param {Function} task - Async function to execute
   * @param {string} requestId - Unique request identifier
   * @returns {Promise} Resolves with task result
   */
  async execute(task, requestId) {
    this.activeCount++;
    this.activeRequests.set(requestId, { startedAt: Date.now() });
    
    try {
      const result = await task();
      return result;
    } finally {
      this.activeRequests.delete(requestId);
      this.activeCount--;
      this.processNext();
    }
  }

  /**
   * Process the next queued task if capacity is available
   */
  processNext() {
    if (this.queue.length === 0 || this.activeCount >= this.maxConcurrent) {
      return;
    }

    const { task, resolve, reject, timeoutId, requestId } = this.queue.shift();
    clearTimeout(timeoutId);

    this.execute(task, requestId)
      .then(result => resolve({ result, requestId }))
      .catch(reject);
  }

  /**
   * Get current queue statistics
   * @returns {Object} Statistics object with activeCount, queueLength, maxConcurrent, maxQueueSize
   */
  getStats() {
    return {
      activeCount: this.activeCount,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize
    };
  }

  /**
   * Get position of a request in the queue
   * @param {string} requestId - Request ID to find
   * @returns {Object|null} Position info or null if not found
   */
  getRequestPosition(requestId) {
    // Check if request is currently active
    if (this.activeRequests.has(requestId)) {
      return {
        status: 'processing',
        position: 0,
        queueLength: this.queue.length,
        estimatedWaitMs: 0
      };
    }

    // Check if request is in queue
    const position = this.queue.findIndex(item => item.requestId === requestId);
    if (position === -1) {
      return null; // Request not found
    }

    // Estimate wait time based on position
    // Assume average processing time of 30 seconds per request
    const avgProcessingTimeMs = 30000;
    const requestsAhead = position + (this.maxConcurrent - this.activeCount);
    const estimatedWaitMs = Math.max(0, requestsAhead * avgProcessingTimeMs);

    return {
      status: 'queued',
      position: position + 1, // 1-indexed for user display
      queueLength: this.queue.length,
      estimatedWaitMs
    };
  }
}

export { RequestQueue };
