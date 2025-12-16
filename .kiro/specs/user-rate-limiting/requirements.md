# Requirements Document

## Introduction

This document outlines the requirements for implementing per-user rate limiting in PerfMon to prevent abuse and ensure fair resource allocation across users. The system will track and limit the number of Lighthouse analyses each user can perform within specific time windows while maintaining the current anonymous, privacy-focused approach.

## Glossary

- **User_Session**: A unique identifier assigned to each browser session for tracking purposes without requiring authentication
- **Rate_Limiter**: The system component that tracks and enforces analysis limits per user session
- **Analysis_Request**: A single request to perform a Lighthouse audit on a URL with specified device type (each URL + device combination counts as one analysis)
- **Time_Window**: A rolling time period (e.g., per hour, per day) used for rate limit calculations
- **Quota**: The maximum number of analyses allowed per user session within a time window
- **Fingerprint**: A combination of browser characteristics (User-Agent, screen resolution, timezone, language) used to identify returning users across sessions without collecting personal data
- **Session_Storage**: Server-side storage that maps fingerprints to usage counters and timestamps
- **Rolling_Counter**: A counter that tracks analyses within a sliding time window, automatically expiring old entries

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to limit the number of analyses each user can perform per hour, so that I can prevent abuse and ensure fair resource allocation.

#### Acceptance Criteria

1. WHEN a user makes their first analysis request THEN the Rate_Limiter SHALL generate a browser fingerprint and create a new User_Session
2. WHEN a User_Session makes an analysis request THEN the Rate_Limiter SHALL count each URL + device type combination as one analysis
3. WHEN checking rate limits THEN the Rate_Limiter SHALL count analyses within a rolling 60-minute window from the current time
4. IF a User_Session exceeds the hourly quota THEN the Rate_Limiter SHALL reject the request with a 429 status code and quota information
5. WHEN an analysis request is within quota limits THEN the Rate_Limiter SHALL record the timestamp and increment the Rolling_Counter for that User_Session

### Requirement 2

**User Story:** As a user, I want to see my current usage and remaining quota, so that I can plan my analysis activities accordingly.

#### Acceptance Criteria

1. WHEN a user visits the application THEN the system SHALL display their current usage count and remaining quota
2. WHEN a user makes an analysis request THEN the system SHALL update the displayed usage count immediately
3. WHEN a user reaches their quota limit THEN the system SHALL display a clear message indicating when they can make more requests
4. WHEN the quota resets THEN the system SHALL update the displayed information automatically
5. WHERE a user has no previous session THEN the system SHALL display the full quota as available

### Requirement 3

**User Story:** As a system administrator, I want to configure different rate limits for different time windows, so that I can balance user experience with resource protection.

#### Acceptance Criteria

1. WHEN the system starts THEN the Rate_Limiter SHALL load configurable limits for hourly and daily quotas
2. WHEN checking rate limits THEN the Rate_Limiter SHALL enforce both hourly and daily quotas simultaneously
3. IF either quota is exceeded THEN the Rate_Limiter SHALL reject the request
4. WHEN configuration changes THEN the Rate_Limiter SHALL apply new limits to future requests without affecting current counters
5. WHERE no configuration is provided THEN the Rate_Limiter SHALL use default values of 10 requests per hour and 50 requests per day

### Requirement 4

**User Story:** As a user, I want my rate limit to persist across browser sessions, so that I cannot bypass limits by refreshing or reopening the browser.

#### Acceptance Criteria

1. WHEN a user makes a request THEN the Rate_Limiter SHALL generate a fingerprint from User-Agent, Accept-Language, and X-Forwarded-For headers
2. WHEN a returning user is identified by fingerprint THEN the Rate_Limiter SHALL load their existing Rolling_Counter from Session_Storage
3. WHEN fingerprinting produces a new signature THEN the Rate_Limiter SHALL create a new User_Session with fresh quotas
4. WHEN storing session data THEN the Rate_Limiter SHALL persist fingerprint mappings and analysis timestamps to file-based storage
5. WHEN the server restarts THEN the Rate_Limiter SHALL load all User_Sessions from persistent storage and clean up expired entries

### Requirement 5

**User Story:** As a privacy-conscious user, I want the rate limiting system to work without requiring personal information, so that I can maintain my anonymity.

#### Acceptance Criteria

1. WHEN creating a User_Session THEN the Rate_Limiter SHALL generate a SHA-256 hash of browser characteristics without storing the original values
2. WHEN generating fingerprints THEN the system SHALL use only HTTP headers available in server requests (User-Agent, Accept-Language, IP address)
3. WHEN storing session data THEN the system SHALL use hashed fingerprints as keys with no personally identifiable information
4. WHEN IP addresses change THEN the system SHALL treat the user as a new User_Session to protect privacy
5. WHERE users share identical fingerprints THEN the system SHALL apply rate limits collectively to that fingerprint group

### Requirement 6

**User Story:** As a developer, I want the rate limiting to work with the existing queue system, so that both global and per-user limits are enforced properly.

#### Acceptance Criteria

1. WHEN an analysis request arrives THEN the Rate_Limiter SHALL check per-user limits before adding to the global queue
2. WHEN per-user limits are exceeded THEN the Rate_Limiter SHALL reject immediately without consuming global queue capacity
3. WHEN per-user limits are satisfied THEN the request SHALL proceed to the existing global queue system
4. WHEN the global queue is full THEN the system SHALL return queue-full errors regardless of per-user quota status
5. WHEN both systems are operational THEN users SHALL be subject to both per-user quotas AND global queue limits

### Requirement 7

**User Story:** As a system administrator, I want to handle rate limit violations gracefully, so that users receive helpful feedback instead of generic errors.

#### Acceptance Criteria

1. WHEN a rate limit is exceeded THEN the system SHALL return a structured error response with quota information
2. WHEN displaying rate limit errors THEN the system SHALL show the time until the oldest analysis expires from the rolling window
3. WHEN a user is near their quota limit THEN the system SHALL display a warning when they have 2 or fewer analyses remaining
4. WHEN quota information is requested THEN the system SHALL provide current usage, limits, and time until next analysis slot becomes available
5. WHERE multiple time windows apply THEN the system SHALL indicate which specific limit was exceeded and its reset time