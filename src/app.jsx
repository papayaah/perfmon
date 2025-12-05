import { useState, useEffect } from 'preact/hooks';
import { Activity, Search, History as HistoryIcon, Trash2, AlertCircle, RefreshCw, Smartphone, Monitor, X, Check, ChevronDown, Home, Copy, CheckCheck, Settings } from 'lucide-preact';
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

  useEffect(() => {
    loadHistory();
  }, []);

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
    return inputUrl.startsWith('http') ? inputUrl : `http://${inputUrl}`;
  };

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

      try {
        const apiUrl = apiEndpoint === 'local' ? customApiUrl : (import.meta.env.VITE_API_URL || '');
        const response = await fetch(`${apiUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, deviceType: dev }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
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
      } catch (err) {
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
        </div>
      </header>

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
              placeholder="Enter URL (e.g., localhost:3000) - Add multiple to run concurrently"
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
          
          <div class="flex gap-2 justify-center mb-4">
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

          <div class="flex flex-wrap gap-2 justify-center items-center">
            <span class="text-xs text-[var(--color-text-muted)]">Quick:</span>
            <QuickPortButton port="5173" onRun={(url) => runAnalysis(normalizeUrl(url))} />
            <QuickPortButton port="4173" onRun={(url) => runAnalysis(normalizeUrl(url))} />
            <QuickPortButton port="3000" onRun={(url) => runAnalysis(normalizeUrl(url))} />
            <QuickPortButton port="8080" onRun={(url) => runAnalysis(normalizeUrl(url))} />
            <QuickPortDropdown
              ports={['5174', '5175', '3001', '3002', '8000']}
              onRun={(url) => runAnalysis(normalizeUrl(url))}
            />
          </div>
        </form>
      </section>

      {running.size > 0 && (
        <section class="mb-12" aria-labelledby="running-heading">
          <h2 id="running-heading" class="text-2xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
            <Activity size={24} class="animate-pulse" />
            Running ({running.size})
          </h2>
          <div class="space-y-3">
            {Array.from(running.entries()).map(([runningKey, state]) => {
              const [runningUrl, devType] = runningKey.split('|');
              return (
                <div key={runningKey} class="bg-surface/80 p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-[var(--color-text)] truncate font-mono text-sm" title={runningUrl}>
                        {runningUrl}
                      </p>
                      <span class="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                        {devType}
                      </span>
                    </div>
                    {state.error ? (
                      <div class="mt-2 text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {state.error}
                      </div>
                    ) : (
                      <p class="text-xs text-[var(--color-text-muted)] mt-1">
                        Running for {Math.floor((now - state.startTime) / 1000)}s
                      </p>
                    )}
                  </div>
                  {!state.error && (
                    <div class="ml-4 w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" class="text-2xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
          <HistoryIcon size={24} />
          History
        </h2>

        {history.length === 0 ? (
          <div class="text-center py-12 bg-surface/50 rounded-2xl border border-[var(--color-border)] border-dashed">
            <p class="text-[var(--color-text-muted)]">No analysis history yet. Run your first test above!</p>
          </div>
        ) : (
          <div class="space-y-4">
            {history.map((report) => {
              const reportUrl = normalizeUrl(report.url);
              const reportDeviceType = report.deviceType || 'desktop';
              const isRunning = running.has(`${reportUrl}|${reportDeviceType}`);
              return (
                <div key={report.id} class="bg-surface p-4 rounded-xl border border-[var(--color-border)] hover:border-primary/50 transition-colors">
                  {/* Main row: thumbnail, URL/time, scores, actions */}
                  <div class="flex items-center gap-4">
                    {report.thumbnail && (
                      <button
                        onClick={() => setExpandedThumbnail(expandedThumbnail === report.id ? null : report.id)}
                        class="flex-shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden border border-[var(--color-border)] bg-surface hover:border-primary transition-colors cursor-pointer"
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
                        <p class="font-medium text-[var(--color-text)] truncate" title={report.url}>{report.url}</p>
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
                      <button
                        onClick={() => handleRefresh(report.url, reportDeviceType)}
                        disabled={isRunning || deletingId === report.id}
                        class="p-2 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Refresh analysis"
                        title="Run new analysis for this URL"
                      >
                        <RefreshCw size={18} class={isRunning ? 'animate-spin' : ''} />
                      </button>
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
                          disabled={isRunning}
                          class="p-2 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Delete report"
                          title="Delete this report"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded audit details - shown below the main row */}
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
            })}
          </div>
        )}
      </section>
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

  return (
    <div class="mt-2 p-4 bg-surface border border-[var(--color-border)] rounded-lg space-y-3 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
      <h4 class="text-sm font-semibold text-[var(--color-text)] mb-3">{category} Issues ({audits.length})</h4>
      {audits.map((audit) => (
        <div key={audit.id} class="p-3 bg-background rounded border border-[var(--color-border)] relative group">
          <div class="flex items-start justify-between gap-2 mb-2">
            <h5 class="text-sm font-medium text-[var(--color-text)] flex-1">{audit.title}</h5>
            <div class="flex items-center gap-1">
              {audit.score !== null && (
                <span class={`text-xs font-bold px-2 py-0.5 rounded ${
                  audit.score >= 90 ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                  audit.score >= 50 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                  'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {Math.round(audit.score)}
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
  );
}

