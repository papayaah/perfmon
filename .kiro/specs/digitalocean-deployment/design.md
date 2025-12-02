# Design Document

## Overview

This design outlines the architecture for deploying PerfMon to DigitalOcean's App Platform. The deployment consists of two components: a static frontend built with Vite/Preact and a Node.js backend service running Express with Lighthouse. The frontend will be served as static files, while the backend runs as a containerized service with Chrome headless for performance analysis.

The key challenge is ensuring Chrome and its dependencies are available in the DigitalOcean environment, which requires either using a Docker container with Chrome pre-installed or leveraging buildpacks that include Chrome support.

## Architecture

### Deployment Model

```
┌─────────────────────────────────────────────────────────────┐
│                    DigitalOcean App Platform                 │
│                                                              │
│  ┌────────────────────┐         ┌─────────────────────────┐ │
│  │   Static Site      │         │   Backend Service       │ │
│  │   (Frontend)       │         │   (Node.js + Express)   │ │
│  │                    │         │                         │ │
│  │  - Preact App      │────────▶│  - Lighthouse API       │ │
│  │  - Built Assets    │  HTTPS  │  - Chrome Headless      │ │
│  │  - IndexedDB       │         │  - CORS Enabled         │ │
│  └────────────────────┘         └─────────────────────────┘ │
│         │                                  │                 │
│         │                                  │                 │
│    Public URL                         Internal URL          │
│  (perfmon.app)                    (backend.ondigitalocean)  │
└─────────────────────────────────────────────────────────────┘
                │                              │
                │                              │
                ▼                              ▼
         User Browser                   Chrome Process
```

### Component Separation

1. **Static Frontend**: Deployed as a static site component
   - Serves pre-built HTML, CSS, and JavaScript
   - No server-side rendering required
   - Uses environment variables injected at build time

2. **Backend Service**: Deployed as a web service component
   - Runs Express server on assigned PORT
   - Launches Chrome for each Lighthouse analysis
   - Handles CORS for cross-origin requests

### Communication Flow

1. User accesses frontend URL
2. Frontend loads in browser with IndexedDB
3. User initiates analysis
4. Frontend sends POST request to backend API URL
5. Backend launches Chrome and runs Lighthouse
6. Backend returns analysis results
7. Frontend stores results in IndexedDB and displays

## Components and Interfaces

### Frontend Component

**Build Configuration**:
- Input: Source files in `src/`
- Build Command: `npm run build`
- Output: Static files in `dist/`
- Environment Variables:
  - `VITE_API_URL`: Backend API base URL (e.g., `https://perfmon-api.ondigitalocean.app`)

**API Client Modifications**:
```javascript
// Current: Uses relative URLs with Vite proxy
fetch('/api/analyze', { ... })

// New: Uses environment variable for production
const API_URL = import.meta.env.VITE_API_URL || '';
fetch(`${API_URL}/api/analyze`, { ... })
```

### Backend Service Component

**Dockerfile** (Option 1 - Recommended):
```dockerfile
FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome path for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server code
COPY server/ ./server/

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server/index.js"]
```

**App Platform Configuration** (`.do/app.yaml`):
```yaml
name: perfmon
region: nyc

services:
  - name: backend
    dockerfile_path: Dockerfile
    github:
      repo: your-username/perfmon
      branch: main
      deploy_on_push: true
    http_port: 8080
    instance_count: 1
    instance_size_slug: professional-xs
    routes:
      - path: /api
    envs:
      - key: PORT
        value: "8080"
      - key: NODE_ENV
        value: "production"
      - key: ALLOWED_ORIGINS
        value: "${APP_URL}"
    health_check:
      http_path: /health
      initial_delay_seconds: 30
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3

static_sites:
  - name: frontend
    github:
      repo: your-username/perfmon
      branch: main
      deploy_on_push: true
    build_command: npm run build
    output_dir: dist
    envs:
      - key: VITE_API_URL
        value: "${backend.PUBLIC_URL}"
    routes:
      - path: /
```

### Modified Backend Server

**server/index.js** changes:

1. **Port Configuration**:
```javascript
// Use PORT from environment (DigitalOcean assigns this)
const PORT = process.env.PORT || 3001;

// Remove auto port detection for production
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
```

2. **CORS Configuration**:
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
```

3. **Chrome Launch Configuration**:
```javascript
const chromeFlags = [
  '--headless',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--no-zygote',
  '--single-process',
  '--disable-extensions'
];

// Use system Chrome if available
const chromePath = process.env.CHROME_PATH || undefined;

chrome = await chromeLauncher.launch({ 
  chromeFlags,
  chromePath
});
```

4. **Health Check Endpoint**:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});
```

### Frontend API Client

**New file: `src/config.js`**:
```javascript
export const API_URL = import.meta.env.VITE_API_URL || '';

export function getApiEndpoint(path) {
  return `${API_URL}${path}`;
}
```

**Modified `src/app.jsx`**:
```javascript
import { getApiEndpoint } from './config';

// Replace fetch calls
const response = await fetch(getApiEndpoint('/api/analyze'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: targetUrl, deviceType })
});
```

## Data Models

### Environment Variables

**Frontend (Build-time)**:
```typescript
interface FrontendEnv {
  VITE_API_URL: string;  // Backend API base URL
}
```

**Backend (Runtime)**:
```typescript
interface BackendEnv {
  PORT: string;              // Server port (assigned by DigitalOcean)
  NODE_ENV: string;          // 'production' | 'development'
  ALLOWED_ORIGINS: string;   // Comma-separated list of allowed origins
  CHROME_PATH?: string;      // Path to Chrome executable
}
```

### Deployment Configuration

**App Platform Spec** (`.do/app.yaml`):
```typescript
interface AppSpec {
  name: string;
  region: string;
  services: Service[];
  static_sites: StaticSite[];
}

interface Service {
  name: string;
  dockerfile_path: string;
  github: GitHubSource;
  http_port: number;
  instance_count: number;
  instance_size_slug: string;
  routes: Route[];
  envs: EnvVar[];
  health_check: HealthCheck;
}

interface StaticSite {
  name: string;
  github: GitHubSource;
  build_command: string;
  output_dir: string;
  envs: EnvVar[];
  routes: Route[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Static asset serving with correct MIME types
*For any* file in the dist directory after build, the static site should serve it with the correct MIME type and be accessible
**Validates: Requirements 1.2**

### Property 2: Port binding consistency
*For any* valid PORT environment variable value, the backend should successfully bind to that port and respond to requests on it
**Validates: Requirements 2.1, 4.2**

### Property 3: Request parameter validation
*For any* POST request to /api/analyze, the system should validate URL and deviceType parameters and reject invalid inputs with 400 status
**Validates: Requirements 2.2**

### Property 4: Chrome launch and Lighthouse execution
*For any* valid analysis request, the system should successfully launch Chrome headless and execute Lighthouse without errors
**Validates: Requirements 2.3**

### Property 5: Analysis response format consistency
*For any* successful Lighthouse analysis, the response should match the expected JSON schema with scores, audits, thumbnails, and metadata fields
**Validates: Requirements 2.4**

### Property 6: API endpoint URL construction
*For any* API request from the frontend, when VITE_API_URL is configured, the request should use the configured URL as the base path with properly constructed full URLs
**Validates: Requirements 3.2, 7.3**

### Property 7: CORS origin validation
*For any* request to the backend, when ALLOWED_ORIGINS is configured, only requests from allowed origins should succeed and receive appropriate CORS headers
**Validates: Requirements 3.4, 8.2, 8.3, 8.5**

### Property 8: Environment variable fallback behavior
*For any* missing optional environment variable, the system should use a sensible default value and continue operating without errors
**Validates: Requirements 4.3, 7.4**

### Property 9: Health check response consistency
*For any* GET request to /health when the backend is running, the system should return a 200 status code with a valid response within the timeout period
**Validates: Requirements 9.2, 9.5**

### Property 10: CORS preflight handling
*For any* OPTIONS preflight request to the API, the system should respond with appropriate CORS headers including allowed methods and origins
**Validates: Requirements 8.2**

## Error Handling

### Frontend Error Scenarios

1. **API Unreachable**:
   - Detect network errors or timeout
   - Display user-friendly message: "Unable to connect to analysis service"
   - Suggest checking internet connection
   - Log error details to console

2. **Invalid API URL**:
   - Validate VITE_API_URL format at build time
   - Fail build if URL is malformed
   - Provide clear error message with expected format

3. **CORS Errors**:
   - Detect CORS-related failures
   - Display message: "API access denied - configuration error"
   - Log full error for debugging

### Backend Error Scenarios

1. **Chrome Launch Failure**:
   - Catch chrome-launcher errors
   - Log detailed error including missing dependencies
   - Return 500 with message: "Browser initialization failed"
   - Include troubleshooting hints in logs

2. **Lighthouse Execution Failure**:
   - Catch Lighthouse errors
   - Distinguish between timeout, network, and analysis errors
   - Return appropriate HTTP status (408 for timeout, 500 for internal)
   - Clean up Chrome process in finally block

3. **Invalid Request Parameters**:
   - Validate URL format before processing
   - Validate deviceType enum
   - Return 400 with specific validation error
   - Do not launch Chrome for invalid requests

4. **Resource Exhaustion**:
   - Detect out-of-memory errors
   - Log memory usage before crash
   - Return 503 Service Unavailable
   - Implement request queuing if needed

### Deployment Error Scenarios

1. **Build Failures**:
   - Validate all required files exist
   - Check Node.js version compatibility
   - Fail fast with clear error messages
   - Include build logs in DigitalOcean dashboard

2. **Health Check Failures**:
   - Log reason for health check failure
   - Retry with exponential backoff
   - Alert if service remains unhealthy
   - Automatic rollback to previous version

3. **Environment Variable Missing**:
   - Check required variables at startup
   - Exit with error code 1 if critical variables missing
   - Log which variables are missing
   - Provide example values in error message

## Testing Strategy

### Unit Tests

Unit tests will verify specific functionality and edge cases:

1. **API Client Configuration**:
   - Test getApiEndpoint with various VITE_API_URL values
   - Test fallback to relative URLs when env var not set
   - Test URL construction with trailing slashes

2. **CORS Configuration**:
   - Test CORS middleware with allowed origin
   - Test CORS rejection with disallowed origin
   - Test wildcard origin handling

3. **Health Check Endpoint**:
   - Test /health returns 200
   - Test response includes timestamp
   - Test response format matches schema

4. **Environment Variable Parsing**:
   - Test ALLOWED_ORIGINS splitting
   - Test PORT parsing and validation
   - Test default value fallbacks

### Property-Based Tests

Property-based tests will verify universal behaviors across many inputs using **fast-check** for JavaScript:

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test must include a comment with this format:
```javascript
// Feature: digitalocean-deployment, Property 1: API endpoint configuration consistency
```

1. **Property 1: API endpoint configuration consistency**
   - Generate random API URLs and paths
   - Verify getApiEndpoint always produces valid URLs
   - Verify no double slashes or malformed URLs

2. **Property 2: CORS origin validation**
   - Generate random origin lists
   - Verify CORS middleware correctly validates each origin
   - Verify wildcard handling is consistent

3. **Property 5: Environment variable fallback**
   - Generate random combinations of present/missing env vars
   - Verify system always has valid configuration
   - Verify no undefined values in critical paths

4. **Property 6: Port binding**
   - Generate random valid port numbers
   - Verify server binds to specified port
   - Verify server rejects invalid ports

### Integration Tests

Integration tests will verify end-to-end workflows:

1. **Full Analysis Flow**:
   - Start backend server
   - Send analysis request
   - Verify response format
   - Verify Chrome cleanup

2. **Frontend-Backend Communication**:
   - Build frontend with test API URL
   - Start backend
   - Simulate user analysis request
   - Verify data flow

3. **Deployment Simulation**:
   - Build Docker container
   - Start container with production env vars
   - Run health checks
   - Execute sample analysis

### Manual Testing Checklist

Before deployment:
- [ ] Build frontend with production API URL
- [ ] Verify no console errors in built frontend
- [ ] Start backend with production flags
- [ ] Test analysis on multiple URLs
- [ ] Test both mobile and desktop device types
- [ ] Verify CORS headers in browser network tab
- [ ] Test health check endpoint
- [ ] Verify Chrome launches without errors
- [ ] Check memory usage during analysis
- [ ] Test error scenarios (invalid URL, timeout)

## Deployment Process

### Prerequisites

1. DigitalOcean account with App Platform access
2. GitHub repository with PerfMon code
3. DigitalOcean CLI installed (optional, for command-line deployment)

### Step-by-Step Deployment

1. **Prepare Repository**:
   - Create Dockerfile in repository root
   - Create `.do/app.yaml` configuration
   - Commit and push to GitHub

2. **Create App in DigitalOcean**:
   - Navigate to App Platform in DigitalOcean dashboard
   - Click "Create App"
   - Connect GitHub repository
   - Select branch (main/master)

3. **Configure Components**:
   - App Platform will detect app.yaml
   - Review detected components (backend service + static site)
   - Verify build and run commands
   - Set environment variables

4. **Configure Resources**:
   - Backend: Professional-XS or higher (needs memory for Chrome)
   - Frontend: Basic (static files only)
   - Region: Choose closest to target users

5. **Deploy**:
   - Review configuration
   - Click "Create Resources"
   - Wait for build and deployment (5-10 minutes)

6. **Verify Deployment**:
   - Check health endpoint: `https://backend-url/health`
   - Visit frontend URL
   - Run test analysis
   - Check logs for errors

7. **Configure Custom Domain** (Optional):
   - Add custom domain in App Platform settings
   - Update DNS records
   - Enable HTTPS (automatic with Let's Encrypt)

### Continuous Deployment

Once configured, DigitalOcean will automatically:
- Detect pushes to configured branch
- Build and deploy new versions
- Run health checks before switching traffic
- Rollback automatically if health checks fail

### Monitoring and Maintenance

1. **Logs**:
   - Access via DigitalOcean dashboard
   - Filter by component (frontend/backend)
   - Set up log forwarding to external service

2. **Metrics**:
   - Monitor CPU and memory usage
   - Track request rates and response times
   - Set up alerts for high resource usage

3. **Scaling**:
   - Increase instance count for higher traffic
   - Upgrade instance size if analyses are slow
   - Consider adding Redis for request queuing

## Alternative Deployment Options

### Option 1: Separate Droplet for Backend

Instead of App Platform, deploy backend to a Droplet:

**Pros**:
- More control over environment
- Can install system packages directly
- Potentially lower cost for high usage

**Cons**:
- Manual server management required
- Need to configure reverse proxy (nginx)
- Manual SSL certificate management
- No automatic scaling

### Option 2: Use Puppeteer with Bundled Chrome

Similar to Vercel approach, bundle Chrome with the application:

**Pros**:
- No system dependencies required
- Consistent Chrome version

**Cons**:
- Larger Docker image
- More complex build process
- May hit size limits on some platforms

### Option 3: Serverless Functions on DigitalOcean

Use DigitalOcean Functions (serverless):

**Pros**:
- Pay per execution
- Automatic scaling
- No server management

**Cons**:
- Cold start latency
- Execution time limits
- More complex Chrome setup
- Currently in beta

**Recommendation**: Use App Platform (Option in main design) for best balance of simplicity, cost, and features.

## Cost Estimation

### DigitalOcean App Platform Pricing (as of 2024)

**Backend Service** (Professional-XS):
- $12/month
- 1 GB RAM, 1 vCPU
- Sufficient for moderate usage (100-200 analyses/day)

**Static Site** (Starter):
- $0/month (free tier)
- 1 GB bandwidth included
- Additional bandwidth: $0.01/GB

**Total Estimated Cost**: $12-15/month for moderate usage

**Scaling Considerations**:
- Professional-S ($24/month): 2 GB RAM for higher concurrency
- Multiple instances: Add $12/month per instance for load balancing
- Bandwidth overages: Minimal unless serving large assets

**Comparison to Vercel**:
- Vercel Pro: $20/month
- Vercel serverless functions: Limited execution time
- DigitalOcean: More predictable pricing, better for long-running tasks

## Security Considerations

1. **Chrome Sandbox**:
   - Running with --no-sandbox is required in containers
   - Mitigate by running in isolated container
   - Keep Chrome version updated

2. **CORS Configuration**:
   - Always specify allowed origins in production
   - Never use wildcard (*) in production
   - Validate origin against whitelist

3. **Input Validation**:
   - Validate and sanitize URL inputs
   - Prevent SSRF attacks by blocking internal IPs
   - Rate limit analysis requests

4. **Environment Variables**:
   - Never commit secrets to repository
   - Use DigitalOcean's encrypted environment variables
   - Rotate sensitive values regularly

5. **HTTPS**:
   - DigitalOcean provides automatic HTTPS
   - Enforce HTTPS redirects
   - Use HSTS headers

## Performance Optimization

1. **Chrome Reuse**:
   - Consider keeping Chrome instance alive between requests
   - Implement connection pooling
   - Balance memory usage vs startup time

2. **Caching**:
   - Cache Lighthouse results for identical URLs
   - Use Redis for distributed caching
   - Implement cache invalidation strategy

3. **Request Queuing**:
   - Limit concurrent Chrome instances
   - Queue requests when at capacity
   - Return 429 Too Many Requests when queue full

4. **Resource Limits**:
   - Set memory limits for Chrome
   - Implement request timeouts
   - Monitor and alert on resource usage

## Future Enhancements

1. **Database Integration**:
   - Move from IndexedDB to PostgreSQL
   - Enable cross-device history access
   - Implement user accounts

2. **Scheduled Analyses**:
   - Add cron jobs for periodic monitoring
   - Email notifications for score changes
   - Trend analysis and reporting

3. **API Authentication**:
   - Add API keys for backend access
   - Implement rate limiting per key
   - Usage tracking and quotas

4. **Multi-Region Deployment**:
   - Deploy to multiple DigitalOcean regions
   - Route users to nearest region
   - Improve global performance
