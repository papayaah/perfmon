# Implementation Plan

- [ ] 1. Create frontend API configuration module
  - Create `src/config.js` with API URL configuration
  - Export `API_URL` constant from environment variable
  - Export `getApiEndpoint(path)` helper function
  - _Requirements: 3.1, 4.1, 7.2_

- [ ]* 1.1 Write property test for API endpoint URL construction
  - **Property 6: API endpoint URL construction**
  - **Validates: Requirements 3.2, 7.3**

- [ ] 2. Update frontend to use configurable API endpoints
  - Import `getApiEndpoint` in `src/app.jsx`
  - Replace all `/api/analyze` calls with `getApiEndpoint('/api/analyze')`
  - Ensure fetch calls include full URL construction
  - _Requirements: 3.2, 7.1, 7.3_

- [ ]* 2.1 Write property test for environment variable fallback
  - **Property 8: Environment variable fallback behavior**
  - **Validates: Requirements 4.3, 7.4**

- [ ] 3. Modify backend server for production deployment
  - Update `server/index.js` to use PORT environment variable
  - Remove auto port detection and .server-port file writing for production
  - Bind to '0.0.0.0' instead of 'localhost'
  - Keep development mode with auto port detection when NODE_ENV !== 'production'
  - _Requirements: 2.1, 4.2_

- [ ]* 3.1 Write property test for port binding
  - **Property 2: Port binding consistency**
  - **Validates: Requirements 2.1, 4.2**

- [ ] 4. Implement CORS configuration with origin validation
  - Update CORS middleware in `server/index.js`
  - Read ALLOWED_ORIGINS from environment variable
  - Parse comma-separated origin list
  - Configure CORS with origin validation function
  - Default to wildcard for development when not set
  - _Requirements: 3.4, 8.1, 8.3, 8.4_

- [ ]* 4.1 Write property test for CORS origin validation
  - **Property 7: CORS origin validation**
  - **Validates: Requirements 3.4, 8.2, 8.3, 8.5**

- [ ]* 4.2 Write property test for CORS preflight handling
  - **Property 10: CORS preflight handling**
  - **Validates: Requirements 8.2**

- [ ] 5. Add health check endpoints
  - Add GET /health endpoint to `server/index.js`
  - Add GET /api/health endpoint for consistency
  - Return JSON with status and timestamp
  - Return 200 status code when healthy
  - _Requirements: 9.1, 9.2_

- [ ]* 5.1 Write property test for health check response
  - **Property 9: Health check response consistency**
  - **Validates: Requirements 9.2, 9.5**

- [x] 6. Create request queue manager
  - Create `server/queue.js` with RequestQueue class
  - Implement queue with maxConcurrent and maxQueueSize limits
  - Add async add() method that queues or executes immediately
  - Implement execute() method that tracks active count
  - Add processNext() to handle queue progression
  - Implement timeout handling for queued requests
  - Add getStats() method for queue monitoring
  - _Requirements: 10.1, 10.2, 10.5, 10.6_

- [ ]* 6.1 Write property test for request queuing
  - **Property 11: Request queuing under load**
  - **Validates: Requirements 10.1, 10.2**

- [ ]* 6.2 Write property test for queue capacity enforcement
  - **Property 12: Queue capacity enforcement**
  - **Validates: Requirements 10.3**

- [ ]* 6.3 Write property test for queue timeout handling
  - **Property 13: Queue timeout handling**
  - **Validates: Requirements 10.5**

- [x] 7. Integrate queue into backend server
  - Import RequestQueue in `server/index.js`
  - Initialize queue with MAX_CONCURRENT_ANALYSES and MAX_QUEUE_SIZE from env vars
  - Wrap analysis logic in queue.add() call
  - Handle queue full errors with 429 status
  - Handle timeout errors with 408 status
  - Add QUEUE_TIMEOUT_MS environment variable support
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8. Add queue status endpoint with real-time position
  - Add GET /api/queue-stats endpoint to `server/index.js`
  - Return activeCount, queueLength, maxConcurrent, maxQueueSize
  - Add GET /api/queue-position/:requestId endpoint for position tracking
  - Generate unique requestId for each queued request
  - Return estimated wait time based on queue position
  - _Requirements: 10.1, 10.2_

- [x] 9. Update frontend to show queue position
  - Modify `src/app.jsx` to handle 429 responses
  - Poll /api/queue-stats during analysis
  - Display queue position and estimated wait time to user
  - Show "Processing..." vs "Queued (position X of Y)" status
  - Add retry logic for 429 responses
  - _Requirements: 10.1, 10.4_

- [ ] 10. Update Chrome launch configuration for containerized environments
  - Add production Chrome flags to `server/index.js`
  - Include --no-sandbox, --disable-setuid-sandbox, --disable-dev-shm-usage
  - Add --no-first-run, --no-zygote, --single-process
  - Read CHROME_PATH from environment variable
  - Pass chromePath to chrome-launcher when set
  - _Requirements: 2.5, 5.3, 5.5_

- [ ]* 10.1 Write property test for Chrome launch
  - **Property 4: Chrome launch and Lighthouse execution**
  - **Validates: Requirements 2.3**

- [ ]* 10.2 Write property test for request parameter validation
  - **Property 3: Request parameter validation**
  - **Validates: Requirements 2.2**

- [ ]* 10.3 Write property test for analysis response format
  - **Property 5: Analysis response format consistency**
  - **Validates: Requirements 2.4**

- [ ] 11. Create Dockerfile for backend service
  - Create `Dockerfile` in repository root
  - Use node:20-slim as base image
  - Install Chromium and required system libraries
  - Set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD and CHROME_PATH environment variables
  - Copy package files and install production dependencies
  - Copy server directory
  - Expose port 8080
  - Set CMD to start server
  - _Requirements: 5.1, 5.2, 6.2_

- [ ] 12. Create DigitalOcean App Platform configuration
  - Create `.do/app.yaml` in repository root
  - Define backend service with Dockerfile path
  - Configure backend with http_port, instance size, routes
  - Set backend environment variables (PORT, NODE_ENV, ALLOWED_ORIGINS, MAX_CONCURRENT_ANALYSES, MAX_QUEUE_SIZE, QUEUE_TIMEOUT_MS)
  - Configure health check with path, timeouts, and thresholds
  - Define static site with build command and output directory
  - Set frontend environment variable (VITE_API_URL referencing backend)
  - Configure routes for both components
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.6_

- [ ] 13. Create deployment documentation
  - Create `DEPLOYMENT.md` in repository root
  - Document prerequisites (DigitalOcean account, GitHub repo)
  - Write step-by-step deployment instructions
  - List all environment variables with descriptions (including queue settings)
  - Include troubleshooting section for common issues
  - Document architecture and component separation
  - Add cost estimation section
  - Include monitoring and maintenance guidance
  - Document queue behavior and configuration
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 14. Update main README with deployment information
  - Add "Deployment" section to `README.md`
  - Link to DEPLOYMENT.md for detailed instructions
  - Mention DigitalOcean as deployment option
  - Note differences from local development
  - _Requirements: 11.1_

- [ ] 15. Create .dockerignore file
  - Create `.dockerignore` in repository root
  - Exclude node_modules, .git, dist, .vite directories
  - Exclude development files and documentation
  - Keep server directory and package files

- [ ] 16. Update package.json with deployment scripts
  - Add "start:prod" script for production server
  - Add "docker:build" script for local Docker testing
  - Add "docker:run" script for local Docker testing
  - Ensure "build" script works for production

- [ ] 17. Test local Docker build and run
  - Build Docker image locally
  - Run container with test environment variables including queue settings
  - Verify health endpoint responds
  - Test analysis endpoint with sample URL
  - Test concurrent requests to verify queue behavior
  - Check Chrome launches successfully
  - Verify CORS headers in response
  - Test queue stats endpoint
  - _Requirements: 5.1, 5.2, 5.4, 10.1, 10.2_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
