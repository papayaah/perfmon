# Requirements Document

## Introduction

This specification defines the requirements for deploying PerfMon to DigitalOcean as a replacement for the non-functional Vercel deployment. The deployment will consist of a static frontend hosted on DigitalOcean's App Platform and a Node.js backend service running the Lighthouse analysis API. The system must maintain feature parity with the local development environment while providing a production-ready, scalable solution.

## Glossary

- **PerfMon**: The Lighthouse performance monitoring application
- **Lighthouse API**: The Express.js backend service that runs Lighthouse analyses
- **App Platform**: DigitalOcean's Platform-as-a-Service offering for deploying applications
- **Static Site**: The built Preact frontend application served as static files
- **Backend Service**: The Node.js Express server running Lighthouse analyses
- **Chrome Headless**: The headless Chrome browser used by Lighthouse for web page analysis
- **CORS**: Cross-Origin Resource Sharing configuration for API access
- **Environment Variables**: Configuration values injected at build/runtime

## Requirements

### Requirement 1

**User Story:** As a developer, I want to deploy the PerfMon frontend as a static site on DigitalOcean, so that users can access the application via a public URL.

#### Acceptance Criteria

1. WHEN the frontend is built THEN the system SHALL generate static assets in the dist directory
2. WHEN the static site is deployed THEN the system SHALL serve all HTML, CSS, JavaScript, and asset files correctly
3. WHEN a user visits the deployed URL THEN the system SHALL display the PerfMon landing page
4. WHEN the application loads THEN the system SHALL apply the correct theme based on user preferences
5. WHEN routing occurs THEN the system SHALL handle client-side navigation without server requests

### Requirement 2

**User Story:** As a developer, I want to deploy the Lighthouse API backend on DigitalOcean, so that the frontend can perform performance analyses on any URL.

#### Acceptance Criteria

1. WHEN the backend service starts THEN the system SHALL launch an Express server on the configured port
2. WHEN the backend receives a POST request to /api/analyze THEN the system SHALL validate the URL and deviceType parameters
3. WHEN a valid analysis request is received THEN the system SHALL launch Chrome headless and execute Lighthouse
4. WHEN Lighthouse completes THEN the system SHALL return scores, audits, thumbnails, and metadata as JSON
5. WHEN Chrome is launched THEN the system SHALL use appropriate flags for the DigitalOcean environment including no-sandbox mode

### Requirement 3

**User Story:** As a developer, I want the frontend to communicate with the backend API, so that users can run Lighthouse analyses from the deployed application.

#### Acceptance Criteria

1. WHEN the frontend is built THEN the system SHALL configure the API endpoint URL via environment variables
2. WHEN the frontend makes an API request THEN the system SHALL send requests to the configured backend URL
3. WHEN the backend responds THEN the system SHALL handle both success and error responses appropriately
4. WHEN CORS is configured THEN the system SHALL allow requests from the frontend domain
5. WHEN the API is unavailable THEN the system SHALL display appropriate error messages to users

### Requirement 4

**User Story:** As a developer, I want to configure the deployment using environment variables, so that I can manage different environments without code changes.

#### Acceptance Criteria

1. WHEN the application is deployed THEN the system SHALL read the backend API URL from VITE_API_URL environment variable
2. WHEN the backend starts THEN the system SHALL use the PORT environment variable if provided
3. WHEN environment variables are missing THEN the system SHALL use sensible defaults for local development
4. WHEN building for production THEN the system SHALL inject environment variables at build time
5. WHERE the backend requires Chrome THEN the system SHALL detect and use the system Chrome installation

### Requirement 5

**User Story:** As a developer, I want to ensure Chrome and its dependencies are available in the DigitalOcean environment, so that Lighthouse can run successfully.

#### Acceptance Criteria

1. WHEN the backend service is deployed THEN the system SHALL include Chrome browser in the container or environment
2. WHEN Chrome launches THEN the system SHALL have all required system libraries available
3. WHEN running in a containerized environment THEN the system SHALL use appropriate Chrome flags including no-sandbox and disable-dev-shm-usage
4. WHEN Chrome fails to launch THEN the system SHALL log detailed error messages
5. WHEN system resources are constrained THEN the system SHALL configure Chrome to use minimal resources

### Requirement 6

**User Story:** As a developer, I want to create deployment configuration files, so that DigitalOcean can automatically build and deploy the application.

#### Acceptance Criteria

1. WHEN deployment configuration exists THEN the system SHALL define both frontend and backend components
2. WHEN the backend is configured THEN the system SHALL specify Node.js version, build commands, and run commands
3. WHEN the frontend is configured THEN the system SHALL specify build commands and output directory
4. WHEN environment variables are needed THEN the system SHALL declare them in the deployment configuration
5. WHEN health checks are configured THEN the system SHALL define appropriate endpoints and timeouts

### Requirement 7

**User Story:** As a developer, I want to modify the frontend build process, so that it uses the production API URL instead of the local proxy.

#### Acceptance Criteria

1. WHEN building for production THEN the system SHALL replace API proxy configuration with direct API calls
2. WHEN the VITE_API_URL is set THEN the system SHALL use it for all API requests
3. WHEN making API calls THEN the system SHALL construct full URLs including protocol and domain
4. WHEN the API URL is not configured THEN the system SHALL fall back to relative URLs for local development
5. WHEN the build completes THEN the system SHALL not include development-only proxy configuration

### Requirement 8

**User Story:** As a developer, I want to ensure the backend handles CORS correctly, so that the frontend can make cross-origin requests to the API.

#### Acceptance Criteria

1. WHEN the backend starts THEN the system SHALL configure CORS middleware
2. WHEN a preflight OPTIONS request is received THEN the system SHALL respond with appropriate CORS headers
3. WHEN the ALLOWED_ORIGINS environment variable is set THEN the system SHALL restrict CORS to those origins
4. WHEN ALLOWED_ORIGINS is not set THEN the system SHALL allow all origins for development purposes
5. WHEN CORS validation fails THEN the system SHALL reject the request with appropriate status codes

### Requirement 9

**User Story:** As a developer, I want to add health check endpoints, so that DigitalOcean can monitor the backend service status.

#### Acceptance Criteria

1. WHEN the backend is running THEN the system SHALL expose a GET /health endpoint
2. WHEN the health endpoint is called THEN the system SHALL return a 200 status code with a success message
3. WHEN the health check includes Chrome validation THEN the system SHALL verify Chrome can be launched
4. WHEN the service is unhealthy THEN the system SHALL return a 503 status code
5. WHEN DigitalOcean performs health checks THEN the system SHALL respond within the configured timeout

### Requirement 10

**User Story:** As a developer, I want to create deployment documentation, so that other developers can deploy and maintain the application.

#### Acceptance Criteria

1. WHEN documentation is created THEN the system SHALL include step-by-step deployment instructions
2. WHEN environment variables are documented THEN the system SHALL list all required and optional variables
3. WHEN troubleshooting steps are provided THEN the system SHALL cover common deployment issues
4. WHEN the documentation describes architecture THEN the system SHALL explain the frontend-backend separation
5. WHEN cost information is included THEN the system SHALL estimate DigitalOcean resource requirements
