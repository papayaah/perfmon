# User Rate Limiting Design Document

## Overview

This design implements per-user rate limiting for PerfMon's Lighthouse analysis service using anonymous browser fingerprinting. The system will track analysis usage per user session without requiring authentication, using a combination of HTTP headers to create unique but anonymous user identifiers. Rate limiting will be enforced before requests enter the existing global queue system.

## Architecture

The rate limiting system will be implemented as middleware in the Express server, positioned before the existing queue system. It will consist of three main components:

1. **Fingerprint Generator**: Creates anonymous user identifiers from HTTP request headers
2. **Rate Limiter**: Tracks usage and enforces quotas using rolling time windows
3. **Storage Manager**: Persists user session data to disk for cross-restart persistence

```
Request Flow:
HTTP Request → Fingerprint Generator → Rate Limiter → Global Queue → Lighthouse Analysis
                                          ↓
                                    Storage Manager
```

## Components and Interfaces

### FingerprintGenerator

```javascript
class FingerprintGenerator {
  /**
   * Generate anonymous fingerprint from HTTP request
   * @param {Object} req - Express request object
   * @returns {string} SHA-256 hash of browser characteristics
   */
  generateFingerprint(req)
  
  /**
   * Extract relevant headers for fingerprinting
   * @param {Object} req - Express request object
   * @returns {Object} Normalized header values
   */
  extractHeaders(req)
}
```

### RateLimiter

```javascript
class RateLimiter {
  /**
   * Check if request is within rate limits
   * @param {string} fingerprint - User fingerprint
   * @returns {Object} { allowed: boolean, quotaInfo: Object }
   */
  checkLimit(fingerprint)
  
  /**
   * Record a successful analysis
   * @param {string} fingerprint - User fingerprint
   */
  recordAnalysis(fingerprint)
  
  /**
   * Get current quota status for user
   * @param {string} fingerprint - User fingerprint
   * @returns {Object} Usage and limit information
   */
  getQuotaStatus(fingerprint)
  
  /**
   * Clean up expired entries
   */
  cleanup()
}
```

### StorageManager

```javascript
class StorageManager {
  /**
   * Load user sessions from disk
   * @returns {Map} User sessions data
   */
  load()
  
  /**
   * Save user sessions to disk
   * @param {Map} sessions - User sessions data
   */
  save(sessions)
  
  /**
   * Initialize storage file if not exists
   */
  init()
}
```

## Data Models

### UserSession

```javascript
{
  fingerprint: string,           // SHA-256 hash of browser characteristics
  analyses: [                    // Array of analysis timestamps
    {
      timestamp: Date,           // When analysis was performed
      url: string,              // URL analyzed (for debugging)
      deviceType: string        // mobile/desktop
    }
  ],
  createdAt: Date,              // When session was first created
  lastActivity: Date            // Last analysis timestamp
}
```

### QuotaInfo

```javascript
{
  current: number,              // Current usage count
  limit: number,                // Maximum allowed
  resetTime: Date,              // When oldest analysis expires
  timeWindow: string,           // "1h" or "24h"
  remaining: number             // Analyses remaining
}
```

### RateLimitConfig

```javascript
{
  hourlyLimit: number,          // Default: 10
  dailyLimit: number,           // Default: 50
  cleanupInterval: number,      // Default: 300000 (5 minutes)
  storageFile: string          // Default: "rate-limits.json"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Fingerprint consistency
*For any* HTTP request with identical headers, the fingerprint generator should produce the same SHA-256 hash
**Validates: Requirements 4.1, 5.1**

Property 2: Rolling window accuracy
*For any* user session, the rate limiter should count only analyses within the last 60 minutes from the current time
**Validates: Requirements 1.3**

Property 3: Quota enforcement
*For any* user session at quota limit, the next analysis request should be rejected with 429 status code
**Validates: Requirements 1.4, 3.3**

Property 4: Analysis counting
*For any* valid analysis request, the system should increment the user's counter and record the timestamp
**Validates: Requirements 1.5, 1.2**

Property 5: Session persistence
*For any* user session, restarting the system should restore the session with identical usage counters and timestamps
**Validates: Requirements 4.2, 4.5**

Property 6: Privacy protection
*For any* stored user session, the data should contain only SHA-256 hashes with no personally identifiable information
**Validates: Requirements 5.1, 5.3**

Property 7: Multi-window enforcement
*For any* user session, both hourly and daily quotas should be enforced simultaneously
**Validates: Requirements 3.2**

Property 8: Queue integration
*For any* analysis request, rate limiting should be checked before the request enters the global queue
**Validates: Requirements 6.1, 6.2**

Property 9: Error response structure
*For any* rate limit violation, the error response should include current usage, limits, and reset time information
**Validates: Requirements 7.1, 7.4**

Property 10: Configuration loading
*For any* system startup, the rate limiter should load configuration values or use defaults (10/hour, 50/day)
**Validates: Requirements 3.1, 3.5**
