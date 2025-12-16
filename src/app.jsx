import { useState, useEffect } from 'preact/hooks';
import { Activity, Search, History as HistoryIcon, Trash2, AlertCircle, RefreshCw, Smartphone, Monitor, X, Check, ChevronDown, Home, Copy, CheckCheck, Settings, Linkedin, Twitter, MessageCircle, Code } from 'lucide-preact';
import { ScoreCard } from './components/ScoreCard';
import { ThemeToggle } from './components/ThemeToggle';
import { addReport, getReports, deleteReport } from './db';

function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  return [theme, setTheme];
}

function DeviceButton({ id, label, icon: Icon, isActive, onClick }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      class={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
        isActive
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-surface border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-primary/50 hover:text-[var(--color-text)]'
      }`}
      aria-pressed={isActive}
      aria-label={`Select ${label} device type`}
    >
      <Icon size={18} />
      <span class="text-sm font-medium">{label}</span>
    </button>
  );
}

function QuickPortButton({ port, onRun }) {
  return (
    <button
      type="button"
      onClick={() => onRun(`localhost:${port}`)}
      class="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all"
      title={`Run analysis on localhost:${port}`}
    >
      {port}
    </button>
  );
}

function QuickPortDropdown({ ports, onRun }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div class="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        class="px-2 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all flex items-center gap-1"
        title="More ports"
      >
        <ChevronDown size={14} class={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div class="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div class="absolute top-full right-0 mt-1 z-50 bg-surface border border-[var(--color-border)] rounded-lg shadow-lg p-1 min-w-[80px]">
            {ports.map((port) => (
              <button
                key={port}
                type="button"
                onClick={() => {
                  onRun(`localhost:${port}`);
                  setIsOpen(false);
                }}
                class="w-full px-3 py-1.5 text-xs font-mono font-medium rounded text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 transition-all text-left"
              >
                {port}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RetryDropdown({ reportId, currentDeviceType, onRetry, isRunning, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const alternateDeviceType = currentDeviceType === 'desktop' ? 'mobile' : 'desktop';

  const handleRefreshClick = (e) => {
    e.stopPropagation();
    if (!disabled) {
      onRetry(currentDeviceType);
    }
  };

  const handleChevronClick = (e) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div class="relative flex items-center">
      <button
        type="button"
        onClick={handleRefreshClick}
        disabled={disabled}
        class="p-2 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Retry analysis"
        title="Retry analysis with same device type"
      >
        <RefreshCw size={18} class={isRunning ? 'animate-spin' : ''} />
      </button>
      <button
        type="button"
        onClick={handleChevronClick}
        disabled={disabled}
        class="p-1 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Retry options"
        title="Choose device type for retry"
      >
        <ChevronDown size={12} class={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <>
          <div class="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div class="absolute top-full right-0 mt-1 z-50 bg-surface border border-[var(--color-border)] rounded-lg shadow-lg p-1 min-w-[160px]">
            <button
              type="button"
              onClick={() => {
                onRetry(currentDeviceType);
                setIsOpen(false);
              }}
              class="w-full px-3 py-2 text-sm font-medium rounded text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 transition-all text-left flex items-center gap-2"
            >
              {currentDeviceType === 'desktop' ? <Monitor size={16} /> : <Smartphone size={16} />}
              <span>Retry ({currentDeviceType === 'desktop' ? 'Desktop' : 'Mobile'})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onRetry(alternateDeviceType);
                setIsOpen(false);
              }}
              class="w-full px-3 py-2 text-sm font-medium rounded text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 transition-all text-left flex items-center gap-2"
            >
              {alternateDeviceType === 'desktop' ? <Monitor size={16} /> : <Smartphone size={16} />}
              <span>Retry ({alternateDeviceType === 'desktop' ? 'Desktop' : 'Mobile'})</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function App() {
  const [theme, setTheme] = useTheme();
  const [url, setUrl] = useState('');
  const [deviceType, setDeviceType] = useState('desktop'); // 'mobile', 'desktop', or 'both'
  const [running, setRunning] = useState(new Map()); // URL -> { startTime, error, deviceType }
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [deletingId, setDeletingId] = useState(null); // Track which item is in delete confirmation state
  const [expandedThumbnail, setExpandedThumbnail] = useState(null); // Track which thumbnail is expanded
  const [expandedAudits, setExpandedAudits] = useState(new Map()); // Track expanded audits: reportId -> category
  const [expandedDomains, setExpandedDomains] = useState(new Set()); // Track which domains have expanded history
  const [showSettings, setShowSettings] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('apiEndpoint') || 'cloud';
    }
    return 'cloud';
  });
  const [customApiUrl, setCustomApiUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customApiUrl') || 'http://localhost:3001';
    }
    return 'http://localhost:3001';
  });
  const [globalQueueStats, setGlobalQueueStats] = useState(null);

  useEffect(() => {
    loadHistory();
    fetchGlobalQueueStats();

    // Poll global queue stats - faster when requests are active
    const pollInterval = running.size > 0 ? 2000 : 5000;
    const interval = setInterval(fetchGlobalQueueStats, pollInterval);
    return () => clearInterval(interval);
  }, [apiEndpoint, customApiUrl, running.size]);

  const fetchGlobalQueueStats = async () => {
    try {
      const apiUrl = apiEndpoint === 'local' ? customApiUrl : (import.meta.env.VITE_API_URL || '');
      const response = await fetch(`${apiUrl}/api/queue-stats`);
      
      if (response.ok) {
        const stats = await response.json();
        setGlobalQueueStats(stats);
      }
    } catch (err) {
      console.error('Error fetching global queue stats:', err);
    }
  };

  // Update current time every second when there are running analyses
  useEffect(() => {
    if (running.size === 0) return;
    
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [running.size]);

  const loadHistory = async () => {
    const reports = await getReports();
    // Sort by timestamp descending
    const sorted = reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    // Debug: log first report's audit data
    if (sorted.length > 0) {
      console.log('Loaded report from DB:', {
        id: sorted[0].id,
        url: sorted[0].url,
        hasAudits: !!sorted[0].audits,
        auditCounts: sorted[0].audits ? {
          performance: sorted[0].audits.performance?.length || 0,
          accessibility: sorted[0].audits.accessibility?.length || 0,
          bestPractices: sorted[0].audits.bestPractices?.length || 0,
          seo: sorted[0].audits.seo?.length || 0,
        } : null,
        scores: sorted[0].scores
      });
    }
    setHistory(sorted);
  };

  const normalizeUrl = (inputUrl) => {
    // Match server behavior: prefer https://
    if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
      return inputUrl;
    }
    return `https://${inputUrl}`;
  };

  // Clean URL for display: drop https:// and trailing slash
  const displayUrl = (inputUrl) => {
    let url = inputUrl;
    if (url.startsWith('https://')) {
      url = url.slice(8);
    } else if (url.startsWith('http://')) {
      url = url.slice(7);
    }
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  };

  // Extract domain from URL for grouping
  const getDomain = (urlString) => {
    try {
      const normalized = normalizeUrl(urlString);
      const url = new URL(normalized);
      return url.hostname;
    } catch {
      return urlString;
    }
  };

  // Group history by domain, returning { domain, latest, pastRuns }
  const groupedHistory = (() => {
    const groups = new Map();

    for (const report of history) {
      const domain = getDomain(report.url);

      if (!groups.has(domain)) {
        groups.set(domain, { domain, latest: report, pastRuns: [] });
      } else {
        // History is already sorted by timestamp descending, so first entry is latest
        groups.get(domain).pastRuns.push(report);
      }
    }

    return Array.from(groups.values());
  })();

  const runAnalysis = async (targetUrl, device = deviceType) => {
    const devicesToRun = device === 'both' ? ['mobile', 'desktop'] : [device];

    for (const dev of devicesToRun) {
      const runningKey = `${targetUrl}|${dev}`;
      
      // Prevent duplicate runs for the same URL + device combination
      if (running.has(runningKey)) {
        continue;
      }

      // Add to running state
      setRunning(prev => new Map(prev).set(runningKey, { startTime: Date.now(), deviceType: dev }));

      // Start polling queue stats
      const apiUrl = apiEndpoint === 'local' ? customApiUrl : (import.meta.env.VITE_API_URL || '');
      const pollIntervalId = startQueueStatsPolling(runningKey, apiUrl);

      try {
        const response = await fetch(`${apiUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, deviceType: dev }),
        });

        // Handle 429 (queue full) - retry with exponential backoff
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          
          // Update state to show queue is full
          setRunning(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(runningKey) || {};
            newMap.set(runningKey, { 
              ...existing, 
              queueFull: true,
              error: errorData.message || 'Queue is full, retrying...',
              queueStats: errorData.queueStats
            });
            return newMap;
          });

          // Retry after a delay (exponential backoff: 2s, 4s, 8s)
          let retryDelay = 2000;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            // Update retry status
            setRunning(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(runningKey) || {};
              newMap.set(runningKey, { 
                ...existing, 
                error: `Retrying... (attempt ${retryCount + 1}/${maxRetries})`
              });
              return newMap;
            });

            const retryResponse = await fetch(`${apiUrl}/api/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: targetUrl, deviceType: dev }),
            });

            if (retryResponse.status !== 429) {
              // Success or different error - process normally
              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Analysis failed');
              }

              const data = await retryResponse.json();
              console.log('Received data from server:', {
                url: data.url,
                hasAudits: !!data.audits,
                auditCounts: data.audits ? {
                  performance: data.audits.performance?.length || 0,
                  accessibility: data.audits.accessibility?.length || 0,
                  bestPractices: data.audits.bestPractices?.length || 0,
                  seo: data.audits.seo?.length || 0,
                } : null
              });
              await addReport(data);
              await loadHistory();
              clearInterval(pollIntervalId);
              return; // Success, exit the function
            }

            retryCount++;
            retryDelay *= 2; // Exponential backoff
          }

          // Max retries reached
          clearInterval(pollIntervalId);
          throw new Error('Queue is full. Please try again later.');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          clearInterval(pollIntervalId);
          throw new Error(errorData.error || 'Analysis failed');
        }

        const data = await response.json();
        
        console.log('Received data from server:', {
          url: data.url,
          hasAudits: !!data.audits,
          auditCounts: data.audits ? {
            performance: data.audits.performance?.length || 0,
            accessibility: data.audits.accessibility?.length || 0,
            bestPractices: data.audits.bestPractices?.length || 0,
            seo: data.audits.seo?.length || 0,
          } : null
        });
        await addReport(data);
        await loadHistory();
        clearInterval(pollIntervalId);
      } catch (err) {
        clearInterval(pollIntervalId);
        // Store error in running state
        setRunning(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(runningKey) || {};
          newMap.set(runningKey, { ...existing, error: err.message });
          return newMap;
        });
      } finally {
        // Remove from running after a short delay to show completion
        setTimeout(() => {
          setRunning(prev => {
            const newMap = new Map(prev);
            newMap.delete(runningKey);
            return newMap;
          });
        }, 500);
      }
    }
  };

  const startQueueStatsPolling = (runningKey, apiUrl) => {
    const pollInterval = setInterval(async () => {
      try {
        // Check if request is still running
        const currentRunning = running.get(runningKey);
        if (!currentRunning) {
          clearInterval(pollInterval);
          return;
        }

        const response = await fetch(`${apiUrl}/api/queue-stats`);
        
        if (!response.ok) {
          return;
        }

        const stats = await response.json();
        
        // Update running state with general queue stats
        setRunning(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(runningKey);
          if (existing) {
            newMap.set(runningKey, {
              ...existing,
              queueStats: stats
            });
          }
          return newMap;
        });
      } catch (err) {
        console.error('Error polling queue stats:', err);
      }
    }, 3000); // Poll every 3 seconds

    return pollInterval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const targetUrl = normalizeUrl(trimmedUrl);
    setUrl(''); // Clear input to allow entering another URL
    await runAnalysis(targetUrl);
  };

  const handleRefresh = async (urlToRefresh, reportDeviceType = 'desktop') => {
    const targetUrl = normalizeUrl(urlToRefresh);
    await runAnalysis(targetUrl, reportDeviceType);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const handleDeleteConfirm = async (id) => {
    await deleteReport(id);
    await loadHistory();
    setDeletingId(null);
  };

  const handleDeleteCancel = () => {
    setDeletingId(null);
  };

  const saveApiSettings = () => {
    localStorage.setItem('apiEndpoint', apiEndpoint);
    localStorage.setItem('customApiUrl', customApiUrl);
    setShowSettings(false);
  };

  return (
    <main class="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto">
      {/* Settings Modal */}
      {showSettings && (
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div class="bg-surface border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 class="text-xl font-bold text-[var(--color-text)] mb-4">API Settings</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[var(--color-text)] mb-2">API Endpoint</label>
                <select
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  class="w-full bg-background text-[var(--color-text)] px-4 py-2 rounded-lg border border-[var(--color-border)] focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option value="cloud">Cloud (DigitalOcean) - Public URLs only</option>
                  <option value="local">Local Server - For localhost sites</option>
                </select>
              </div>

              {apiEndpoint === 'local' && (
                <div>
                  <label class="block text-sm font-medium text-[var(--color-text)] mb-2">Local API URL</label>
                  <input
                    type="text"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="http://localhost:3001"
                    class="w-full bg-background text-[var(--color-text)] px-4 py-2 rounded-lg border border-[var(--color-border)] focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                  <p class="text-xs text-[var(--color-text-muted)] mt-2">
                    Run <code class="bg-background px-1 py-0.5 rounded">npm run dev:server</code> locally first
                  </p>
                </div>
              )}

              <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p class="text-xs text-blue-400 font-medium mb-1">💡 Tip: Use ngrok for localhost</p>
                <p class="text-xs text-[var(--color-text-muted)]">
                  Expose your local site with: <code class="bg-background px-1 py-0.5 rounded">ngrok http 5173</code>
                  <br/>Then analyze the ngrok URL with Cloud API
                </p>
              </div>
            </div>

            <div class="flex gap-2 mt-6">
              <button
                onClick={saveApiSettings}
                class="flex-1 bg-primary text-background px-4 py-2 rounded-lg hover:bg-green-400 transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setShowSettings(false)}
                class="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-primary/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <header class="mb-10">
        <div class="flex justify-between items-center mb-4">
          <a
            href="/"
            class="p-2 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Back to home"
          >
            <Home size={20} />
          </a>
          <div class="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              class="p-2 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>
        <div class="text-center">
          <h1 class="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
            <Activity size={40} />
            PerfMon
          </h1>
          <p class="text-[var(--color-text-muted)]">Lighthouse Performance Analytics & History</p>
          {globalQueueStats && globalQueueStats.totalAnalyses > 0 && (
            <p class="text-xs text-[var(--color-text-muted)] mt-2">
              <span class="font-mono font-semibold text-primary">{globalQueueStats.totalAnalyses.toLocaleString()}</span> analyses performed
            </p>
          )}
        </div>
      </header>

      {/* Global Queue Status Banner */}
      {globalQueueStats && (
        <div class="mb-6 max-w-2xl mx-auto">
          {globalQueueStats.activeCount >= globalQueueStats.maxConcurrent && globalQueueStats.queueLength > 0 ? (
            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div class="flex items-center gap-3">
                <AlertCircle size={20} class="text-yellow-400 flex-shrink-0" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-yellow-400">Queue is busy</p>
                  <p class="text-xs text-[var(--color-text-muted)] mt-1">
                    {globalQueueStats.activeCount} analysis running, {globalQueueStats.queueLength} waiting in queue
                    {globalQueueStats.queueLength > 0 && (
                      <span> • Estimated wait: ~{Math.ceil((globalQueueStats.queueLength * 30000) / 1000)}s</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : globalQueueStats.activeCount > 0 ? (
            <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div class="flex items-center gap-3">
                <Activity size={20} class="text-blue-400 flex-shrink-0 animate-pulse" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-blue-400">System is processing</p>
                  <p class="text-xs text-[var(--color-text-muted)] mt-1">
                    {globalQueueStats.activeCount} analysis running • Queue is available
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div class="flex items-center gap-3">
                <Check size={20} class="text-green-400 flex-shrink-0" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-green-400">Ready to analyze</p>
                  <p class="text-xs text-[var(--color-text-muted)] mt-1">
                    No queue • Your analysis will start immediately
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <section class="mb-12" aria-labelledby="analyze-heading">
        <h2 id="analyze-heading" class="sr-only">Analyze URL</h2>
        <form onSubmit={handleSubmit} class="max-w-2xl mx-auto">
          <div class="relative mb-4">
            <label htmlFor="url-input" class="sr-only">Enter URL to analyze</label>
            <input
              id="url-input"
              type="text"
              value={url}
              onInput={(e) => setUrl(e.currentTarget.value)}
              placeholder="Enter URL (e.g., example.com or https://yoursite.com)"
              class="w-full bg-surface text-[var(--color-text)] px-6 py-4 pr-14 rounded-2xl border border-[var(--color-border)] focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all text-lg shadow-lg placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="submit"
              disabled={!url.trim()}
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-background rounded-xl hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Start Analysis"
            >
              <Search size={24} />
            </button>
          </div>
          
          <div class="flex gap-2 justify-center">
            <DeviceButton
              id="desktop"
              label="Desktop"
              icon={Monitor}
              isActive={deviceType === 'desktop'}
              onClick={() => setDeviceType('desktop')}
            />
            <DeviceButton
              id="mobile"
              label="Mobile"
              icon={Smartphone}
              isActive={deviceType === 'mobile'}
              onClick={() => setDeviceType('mobile')}
            />
            <DeviceButton
              id="both"
              label="Both"
              icon={Activity}
              isActive={deviceType === 'both'}
              onClick={() => setDeviceType('both')}
            />
          </div>
        </form>
      </section>

      {running.size > 0 && (
        <section class="mb-12" aria-labelledby="running-heading">
          <h2 id="running-heading" class="text-2xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
            <Activity size={24} class="animate-pulse" />
            Active Requests ({running.size})
          </h2>
          <div class="space-y-3">
            {Array.from(running.entries())
              .sort(([, a], [, b]) => a.startTime - b.startTime) // Sort by start time (oldest first)
              .map(([runningKey, state], index) => {
              const [runningUrl, devType] = runningKey.split('|');

              // Use globalQueueStats as source of truth (polled every 5s)
              // Fall back to per-request stats if global not available
              const stats = globalQueueStats || state.queueStats;
              const hasStats = !!stats;

              // Determine status based on queue stats
              // activeCount = number currently being processed server-side
              // queueLength = number waiting in server queue
              // maxConcurrent = max parallel analyses the server supports
              const maxConcurrent = hasStats ? stats.maxConcurrent : 1;
              const activeCount = hasStats ? stats.activeCount : 0;
              const queueLength = hasStats ? stats.queueLength : 0;

              // Check if this specific URL is actively being processed by a worker
              const activeWorker = hasStats && stats.workers?.find(w =>
                w.busy && w.currentJob?.url === runningUrl
              );
              const isActiveOnWorker = !!activeWorker;

              // Get actual processing start time from worker if available
              const processingStartTime = activeWorker?.currentJob?.startedAt
                ? new Date(activeWorker.currentJob.startedAt).getTime()
                : null;

              // isLikelyProcessing: true if this request is being processed
              // isQueued: true if this request is waiting in queue
              let isLikelyProcessing = false;
              let isQueued = false;

              if (isActiveOnWorker) {
                // Definitively processing - we found it on a worker
                isLikelyProcessing = true;
              } else if (!hasStats) {
                // No stats yet - assume first one is processing, rest unknown
                isLikelyProcessing = index === 0;
              } else {
                // Use server's activeCount to determine status
                // If we have more requests than active workers, some are queued
                if (index < activeCount) {
                  // Within active count - likely processing
                  isLikelyProcessing = true;
                } else if (queueLength > 0 && index >= activeCount) {
                  // Server says there's a queue and we're past active count
                  isQueued = true;
                } else if (index < maxConcurrent) {
                  // Fallback: within worker capacity
                  isLikelyProcessing = true;
                } else {
                  // Beyond worker capacity - must be queued
                  isQueued = true;
                }
              }
              
              return (
                <div 
                  key={runningKey} 
                  class={`p-4 rounded-xl border flex items-center justify-between ${
                    isQueued 
                      ? 'bg-yellow-500/5 border-yellow-500/30' 
                      : 'bg-surface/80 border-[var(--color-border)]'
                  }`}
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="font-medium text-[var(--color-text)] truncate font-mono text-sm" title={runningUrl}>
                        {displayUrl(runningUrl)}
                      </p>
                      <span class="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                        {devType}
                      </span>
                      {isQueued ? (
                        <span class="px-2 py-0.5 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                          QUEUED
                        </span>
                      ) : isLikelyProcessing ? (
                        <span class="px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                          PROCESSING
                        </span>
                      ) : null}
                    </div>
                    {state.error ? (
                      <div class="mt-2 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {state.error}
                      </div>
                    ) : isQueued ? (
                      <div class="mt-2">
                        <p class="text-xs text-yellow-400 font-medium">
                          Waiting in queue... ({Math.floor((now - state.startTime) / 1000)}s in queue)
                        </p>
                        {hasStats && queueLength > 0 && (
                          <p class="text-xs text-[var(--color-text-muted)] mt-1">
                            {queueLength} request(s) ahead • Est. wait: ~{Math.ceil((queueLength * 30) / 1)}s
                          </p>
                        )}
                      </div>
                    ) : (
                      <p class="text-xs text-blue-400 font-medium mt-1">
                        Analyzing... ({Math.floor((now - (processingStartTime || state.startTime)) / 1000)}s)
                      </p>
                    )}
                  </div>
                  {!state.error && !isQueued && (
                    <div class="ml-4 w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {isQueued && (
                    <div class="ml-4 text-yellow-400 text-2xl">⋯</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="history-heading">
        <div class="flex items-center justify-between mb-6">
          <h2 id="history-heading" class="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <HistoryIcon size={24} />
            History
          </h2>
          {groupedHistory.length > 0 && (
            <button
              onClick={() => {
                // Run analysis for each unique domain's latest URL
                groupedHistory.forEach(({ latest }) => {
                  const targetUrl = normalizeUrl(latest.url);
                  const targetDevice = latest.deviceType || 'desktop';
                  runAnalysis(targetUrl, targetDevice);
                });
              }}
              disabled={running.size > 0}
              class="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Analyze All ({groupedHistory.length})
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div class="text-center py-12 bg-surface/50 rounded-2xl border border-[var(--color-border)] border-dashed">
            <p class="text-[var(--color-text-muted)]">No analysis history yet. Run your first test above!</p>
          </div>
        ) : (
          <div class="space-y-4">
            {groupedHistory.map(({ domain, latest, pastRuns }) => {
              const isExpanded = expandedDomains.has(domain);
              const hasPastRuns = pastRuns.length > 0;

              const renderReportRow = (report, isCompact = false) => {
                const rUrl = normalizeUrl(report.url);
                const rDeviceType = report.deviceType || 'desktop';
                const rIsRunning = running.has(`${rUrl}|${rDeviceType}`);

                return (
                  <div key={report.id} class={`${isCompact ? 'py-3 px-4 border-t border-[var(--color-border)]/50' : ''}`}>
                    <div class="flex items-center gap-4">
                      {report.thumbnail && (
                        <button
                          onClick={() => setExpandedThumbnail(expandedThumbnail === report.id ? null : report.id)}
                          class={`flex-shrink-0 rounded-lg overflow-hidden border border-[var(--color-border)] bg-surface hover:border-primary transition-colors cursor-pointer ${isCompact ? 'w-12 h-9' : 'w-16 h-12 md:w-20 md:h-14'}`}
                          aria-label="View screenshot"
                        >
                          <img
                            src={report.thumbnail.startsWith('data:') ? report.thumbnail : `data:image/png;base64,${report.thumbnail}`}
                            alt={`Screenshot of ${report.url}`}
                            class="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      )}
                      {expandedThumbnail === report.id && report.thumbnail && (
                        <div
                          class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                          onClick={() => setExpandedThumbnail(null)}
                        >
                          <div class="relative max-w-6xl max-h-[90vh]">
                            <button
                              onClick={() => setExpandedThumbnail(null)}
                              class="absolute -top-10 right-0 text-[var(--color-text)] hover:text-primary transition-colors"
                              aria-label="Close screenshot"
                            >
                              <X size={24} />
                            </button>
                            <img
                              src={report.thumbnail.startsWith('data:') ? report.thumbnail : `data:image/png;base64,${report.thumbnail}`}
                              alt={`Full screenshot of ${report.url}`}
                              class="max-w-full max-h-[90vh] object-contain rounded-lg border border-[var(--color-border)]"
                            />
                          </div>
                        </div>
                      )}

                      {/* URL and timestamp */}
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          {!isCompact && (
                            <p class="font-medium text-[var(--color-text)] truncate" title={report.url}>{displayUrl(report.url)}</p>
                          )}
                          {(() => {
                            const device = report.deviceType || 'desktop';
                            const isMobile = device === 'mobile';
                            return (
                              <span class={`px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1 ${
                                isMobile
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}>
                                {isMobile ? <Smartphone size={12} /> : <Monitor size={12} />}
                                <span class="capitalize">{device}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <time class="text-xs text-[var(--color-text-muted)]">
                          {new Date(report.timestamp).toLocaleString()}
                        </time>
                      </div>

                      {/* Score badges */}
                      <div class="flex items-center gap-2 flex-shrink-0">
                        {[
                          { key: 'performance', label: 'Perf', score: report.scores.performance },
                          { key: 'accessibility', label: 'A11y', score: report.scores.accessibility },
                          { key: 'best-practices', label: 'Best', score: report.scores.bestPractices },
                          { key: 'seo', label: 'SEO', score: report.scores.seo },
                        ].map(({ key, label, score }) => (
                          <Badge
                            key={key}
                            label={label}
                            score={score}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const fullKey = `${report.id}-${key}`;
                              const isCurrentlyExpanded = expandedAudits.get(fullKey);
                              setExpandedAudits(prev => {
                                const newMap = new Map(prev);
                                // Close all categories for this report
                                newMap.delete(`${report.id}-performance`);
                                newMap.delete(`${report.id}-accessibility`);
                                newMap.delete(`${report.id}-best-practices`);
                                newMap.delete(`${report.id}-seo`);
                                // Toggle the clicked one (only open if it wasn't already open)
                                if (!isCurrentlyExpanded) {
                                  newMap.set(fullKey, true);
                                }
                                return newMap;
                              });
                            }}
                            isExpanded={expandedAudits.get(`${report.id}-${key}`)}
                          />
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div class="flex items-center gap-1 flex-shrink-0">
                        <RetryDropdown
                          reportId={report.id}
                          currentDeviceType={rDeviceType}
                          onRetry={(deviceType) => handleRefresh(report.url, deviceType)}
                          isRunning={rIsRunning}
                          disabled={rIsRunning || deletingId === report.id}
                        />
                        {deletingId === report.id ? (
                          <div class="flex items-center gap-1 bg-red-500/20 border border-red-500/50 rounded-lg p-1">
                            <button
                              onClick={() => handleDeleteConfirm(report.id)}
                              class="p-1.5 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                              aria-label="Confirm deletion"
                              title="Confirm delete"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleDeleteCancel}
                              class="p-1.5 text-[var(--color-text-muted)] hover:bg-surface rounded transition-colors"
                              aria-label="Cancel deletion"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteClick(report.id)}
                            disabled={rIsRunning}
                            class="p-2 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Delete report"
                            title="Delete this report"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded audit details */}
                    {expandedAudits.get(`${report.id}-performance`) && (
                      <AuditDetails category="Performance" audits={report.audits?.performance} />
                    )}
                    {expandedAudits.get(`${report.id}-accessibility`) && (
                      <AuditDetails category="Accessibility" audits={report.audits?.accessibility} />
                    )}
                    {expandedAudits.get(`${report.id}-best-practices`) && (
                      <AuditDetails category="Best Practices" audits={report.audits?.bestPractices} />
                    )}
                    {expandedAudits.get(`${report.id}-seo`) && (
                      <AuditDetails category="SEO" audits={report.audits?.seo} />
                    )}
                  </div>
                );
              };

              return (
                <div key={domain} class="bg-surface rounded-xl border border-[var(--color-border)] hover:border-primary/50 transition-colors">
                  {/* Latest result - main row */}
                  <div class="p-4">
                    {renderReportRow(latest, false)}
                  </div>

                  {/* Past runs toggle and expandable section */}
                  {hasPastRuns && (
                    <>
                      <button
                        onClick={() => {
                          setExpandedDomains(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(domain)) {
                              newSet.delete(domain);
                            } else {
                              newSet.add(domain);
                            }
                            return newSet;
                          });
                        }}
                        class="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/5 border-t border-[var(--color-border)]/50 transition-colors"
                      >
                        <ChevronDown size={16} class={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        <span>{isExpanded ? 'Hide' : 'Show'} {pastRuns.length} previous {pastRuns.length === 1 ? 'run' : 'runs'}</span>
                      </button>

                      {isExpanded && (
                        <div class="bg-surface/50">
                          {pastRuns.map(report => renderReportRow(report, true))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer class="mt-16 pt-8 border-t border-[var(--color-border)]">
        <div class="text-center">
          <p class="text-sm text-[var(--color-text-muted)] mb-4">
            If this tool saved you some time, consider following me for more projects
          </p>
          <div class="flex justify-center gap-4 flex-wrap">
            <a
              href="https://www.linkedin.com/in/david-ang-0932bb4a/"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
              title="Follow on LinkedIn"
            >
              <Linkedin size={18} />
              <span class="text-sm">LinkedIn</span>
            </a>
            <a
              href="https://x.com/papayaahtries"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
              title="Follow on X"
            >
              <Twitter size={18} />
              <span class="text-sm">X</span>
            </a>
            <a
              href="https://www.reddit.com/user/Prize-Coyote-6989/"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
              title="Follow on Reddit"
            >
              <MessageCircle size={18} />
              <span class="text-sm">Reddit</span>
            </a>
            <a
              href="https://devpost.com/software/perfmon"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
              title="Check out on Devpost"
            >
              <Code size={18} />
              <span class="text-sm">Devpost</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Badge({ label, score, onClick, isExpanded }) {
  let colorClass = 'bg-red-500/20 text-red-400 border-red-500/30';
  if (score >= 90) colorClass = 'bg-green-500/20 text-green-400 border-green-500/30';
  else if (score >= 50) colorClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  return (
    <button
      onClick={onClick}
      class={`flex flex-col items-center justify-center px-2 py-1 rounded border ${colorClass} min-w-[3.5rem] transition-all hover:scale-105 cursor-pointer ${
        isExpanded ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
      aria-label={`${label} score: ${Math.round(score)}. Click to ${isExpanded ? 'collapse' : 'expand'} details`}
    >
      <span class="text-xs font-bold">{Math.round(score)}</span>
      <span class="text-[0.6rem] uppercase opacity-80">{label}</span>
    </button>
  );
}

function AuditDetails({ category, audits }) {
  // Handle case where audits array is empty or doesn't exist
  // If audits is undefined, it means this is an old report without audit data
  if (audits === undefined) {
    return (
      <div class="mt-2 p-4 bg-surface border border-[var(--color-border)] rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
        <p class="text-yellow-500 dark:text-yellow-400 text-sm mb-1">Audit details not available</p>
        <p class="text-xs text-[var(--color-text-muted)]">This report was created before detailed audit tracking was added. Click the refresh button to run a new analysis and see detailed issues.</p>
      </div>
    );
  }

  // Empty array means no issues found
  if (!audits || audits.length === 0) {
    return (
      <div class="mt-2 p-4 bg-surface border border-[var(--color-border)] rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
        <p class="text-green-600 dark:text-green-400 text-sm mb-1">No issues found! Great job!</p>
        <p class="text-xs text-[var(--color-text-muted)]">This category passed all audits with flying colors.</p>
      </div>
    );
  }

  const [copiedId, setCopiedId] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedGroupSummary, setCopiedGroupSummary] = useState(null); // Track which group was copied

  const copyAuditToClipboard = async (audit) => {
    const text = JSON.stringify(audit, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(audit.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyFailedAuditsSummary = async () => {
    // Filter audits with score 0 or null (failed audits)
    const failedAudits = audits.filter(audit => audit.score === null || audit.score === 0);
    
    if (failedAudits.length === 0) return;

    // Create a formatted summary
    const summary = failedAudits.map((audit, index) => {
      let text = `${index + 1}. ${audit.title}\n`;
      
      // Include score if available
      if (audit.score !== null) {
        text += `   Score: ${Math.round(audit.score)}\n`;
      } else {
        text += `   Score: Failed (critical issue)\n`;
      }
      
      if (audit.description) {
        // Strip HTML tags from description
        const description = audit.description.replace(/<[^>]*>/g, '').trim();
        text += `   ${description}\n`;
      }
      
      if (audit.displayValue) {
        text += `   Value: ${audit.displayValue}\n`;
      }
      
      if (audit.warnings && audit.warnings.length > 0) {
        text += `   Warnings: ${audit.warnings.join('; ')}\n`;
      }
      
      return text;
    }).join('\n');

    const fullSummary = `${category} - Failed Audits Summary (${failedAudits.length} issues)\n${'='.repeat(50)}\n\n${summary}`;

    try {
      await navigator.clipboard.writeText(fullSummary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const copyGroupSummary = async (group, groupName) => {
    const groupAudits = groupedAudits[group] || [];
    
    if (groupAudits.length === 0) return;

    // Create a formatted summary for this group (all audits, not just failed ones)
    const summary = groupAudits.map((audit, index) => {
      let text = `${index + 1}. ${audit.title}\n`;
      
      // Include score if available
      if (audit.score !== null) {
        text += `   Score: ${Math.round(audit.score)}\n`;
      } else {
        text += `   Score: Failed (critical issue)\n`;
      }
      
      if (audit.description) {
        // Strip HTML tags from description
        const description = audit.description.replace(/<[^>]*>/g, '').trim();
        text += `   ${description}\n`;
      }
      
      if (audit.displayValue) {
        text += `   Value: ${audit.displayValue}\n`;
      }
      
      if (audit.warnings && audit.warnings.length > 0) {
        text += `   Warnings: ${audit.warnings.join('; ')}\n`;
      }
      
      return text;
    }).join('\n');

    const fullSummary = `${category} - ${groupName} Summary (${groupAudits.length} ${groupAudits.length === 1 ? 'issue' : 'issues'})\n${'='.repeat(50)}\n\n${summary}`;

    try {
      await navigator.clipboard.writeText(fullSummary);
      setCopiedGroupSummary(group);
      setTimeout(() => setCopiedGroupSummary(null), 2000);
    } catch (err) {
      console.error('Failed to copy group summary:', err);
    }
  };

  // Check if there are any failed audits (score 0 or null)
  const hasFailedAudits = audits.some(audit => audit.score === null || audit.score === 0);

  // Format group names for display
  const formatGroupName = (group) => {
    if (!group || group === 'hidden' || group === 'other') return 'Other';
    // Convert kebab-case to Title Case
    return group
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/a11y/gi, 'A11y')
      .replace(/Seo/gi, 'SEO');
  };

  // Group audits by their group property
  const groupedAudits = audits.reduce((acc, audit) => {
    const group = audit.group || 'other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(audit);
    return acc;
  }, {});

  // Sort groups: metrics first, then diagnostics, then alphabetically
  const groupOrder = ['metrics', 'diagnostics'];
  const sortedGroups = Object.keys(groupedAudits).sort((a, b) => {
    const aIndex = groupOrder.indexOf(a);
    const bIndex = groupOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const [expandedGroups, setExpandedGroups] = useState(new Set(sortedGroups)); // All groups expanded by default

  const toggleGroup = (group) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  return (
    <div class="mt-2 p-4 bg-surface border border-[var(--color-border)] rounded-lg space-y-3 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-[var(--color-text)]">{category} Issues ({audits.length})</h4>
        {hasFailedAudits && (
          <button
            onClick={copyFailedAuditsSummary}
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded-lg border border-[var(--color-border)] transition-colors"
            title="Copy summary of all failed audits"
          >
            {copiedSummary ? (
              <>
                <CheckCheck size={14} class="text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        )}
      </div>
      {sortedGroups.map((group) => {
        const groupAudits = groupedAudits[group];
        const isExpanded = expandedGroups.has(group);
        const groupName = formatGroupName(group);
        
        return (
          <div key={group} class="border border-[var(--color-border)] rounded-lg overflow-hidden">
            <div class="w-full px-3 py-2 bg-background hover:bg-surface transition-colors flex items-center justify-between">
              <button
                onClick={() => toggleGroup(group)}
                class="flex-1 flex items-center justify-between text-left"
              >
                <span class="text-sm font-semibold text-[var(--color-text)]">
                  {groupName} ({groupAudits.length})
                </span>
                <ChevronDown size={16} class={`text-[var(--color-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyGroupSummary(group, groupName);
                }}
                class="ml-2 flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded border border-[var(--color-border)] transition-colors"
                title={`Copy summary of all audits in ${groupName}`}
              >
                {copiedGroupSummary === group ? (
                  <>
                    <CheckCheck size={12} class="text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {isExpanded && (
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                {groupAudits.map((audit) => (
        <div key={audit.id} class="p-3 bg-background rounded border border-[var(--color-border)] relative group">
          <div class="flex items-start justify-between gap-2 mb-2">
            <h5 class="text-sm font-medium text-[var(--color-text)] flex-1">{audit.title}</h5>
            <div class="flex items-center gap-1">
              {audit.score !== null && audit.score > 0 ? (
                <span class={`text-xs font-bold px-2 py-0.5 rounded ${
                  audit.score >= 90 ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                  audit.score >= 50 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                  'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {Math.round(audit.score)}
                </span>
              ) : (
                <span class="flex items-center justify-center text-red-600 dark:text-red-400" title="Critical issue - requires attention">
                  <AlertCircle size={16} />
                </span>
              )}
              <button
                onClick={() => copyAuditToClipboard(audit)}
                class="p-1.5 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded transition-colors"
                title="Copy issue details"
              >
                {copiedId === audit.id ? (
                  <CheckCheck size={14} class="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>

          {audit.description && (
            <p class="text-xs text-[var(--color-text-muted)] mb-2" dangerouslySetInnerHTML={{ __html: audit.description }} />
          )}

          {audit.displayValue && (
            <p class="text-xs text-[var(--color-text)] font-mono mb-2">{audit.displayValue}</p>
          )}

          {audit.warnings && audit.warnings.length > 0 && (
            <div class="mt-2 space-y-1">
              {audit.warnings.map((warning, idx) => (
                <p key={idx} class="text-xs text-yellow-600 dark:text-yellow-400">{warning}</p>
              ))}
            </div>
          )}

          {audit.details && audit.details.type === 'table' && audit.details.headings && audit.details.items && (
            <div class="mt-2 overflow-x-auto">
              <table class="w-full text-xs border-collapse">
                <thead>
                  <tr class="border-b border-[var(--color-border)]">
                    {audit.details.headings.map((heading, idx) => (
                      <th key={idx} class="text-left p-2 text-[var(--color-text-muted)] font-medium">{heading.label || heading.text || heading.key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.details.items.slice(0, 5).map((item, idx) => (
                    <tr key={idx} class="border-b border-[var(--color-border)]">
                      {audit.details.headings.map((heading, hIdx) => {
                        const key = heading.key || heading.value;
                        const value = item[key];
                        return (
                          <td key={hIdx} class="p-2 text-[var(--color-text)]">
                            {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value || '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {audit.details.items.length > 5 && (
                <p class="text-xs text-[var(--color-text-muted)] mt-2">... and {audit.details.items.length - 5} more items</p>
              )}
            </div>
          )}
        </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

