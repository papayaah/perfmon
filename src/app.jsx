import { useState, useEffect } from 'preact/hooks';
import { Activity, Search, Home, Settings, Smartphone, Monitor } from 'lucide-preact';
import { ThemeToggle } from './components/ThemeToggle';
import { DeviceButton } from './components/DeviceButton';
import { SettingsModal } from './components/SettingsModal';
import { QueueStatusBanner } from './components/QueueStatusBanner';
import { ActiveRequests } from './components/ActiveRequests';
import { HistorySection } from './components/HistorySection';
import { Footer } from './components/Footer';
import { useTheme } from './hooks/useTheme';
import { normalizeUrl } from './utils/url';
import { addReport, getReports, deleteReport } from './db';

export function App() {
  const [theme, setTheme] = useTheme();
  const [url, setUrl] = useState('');
  const [deviceType, setDeviceType] = useState('desktop');
  const [running, setRunning] = useState(new Map());
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(Date.now());
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
    const pollInterval = running.size > 0 ? 2000 : 5000;
    const interval = setInterval(fetchGlobalQueueStats, pollInterval);
    return () => clearInterval(interval);
  }, [apiEndpoint, customApiUrl, running.size]);

  useEffect(() => {
    if (running.size === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [running.size]);

  const fetchGlobalQueueStats = async () => {
    try {
      const apiUrl = apiEndpoint === 'local' ? customApiUrl : (import.meta.env.VITE_API_URL || '');
      const response = await fetch(`${apiUrl}/api/queue-stats`);
      if (response.ok) {
        setGlobalQueueStats(await response.json());
      }
    } catch (err) {
      console.error('Error fetching global queue stats:', err);
    }
  };

  const loadHistory = async () => {
    const reports = await getReports();
    setHistory(reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  const runAnalysis = async (targetUrl, device = deviceType) => {
    const devicesToRun = device === 'both' ? ['mobile', 'desktop'] : [device];

    for (const dev of devicesToRun) {
      const runningKey = `${targetUrl}|${dev}`;
      if (running.has(runningKey)) continue;

      setRunning(prev => new Map(prev).set(runningKey, { startTime: Date.now(), deviceType: dev }));

      const apiUrl = apiEndpoint === 'local' ? customApiUrl : (import.meta.env.VITE_API_URL || '');
      const pollIntervalId = startQueueStatsPolling(runningKey, apiUrl);

      try {
        const response = await fetch(`${apiUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, deviceType: dev }),
        });

        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          setRunning(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(runningKey) || {};
            newMap.set(runningKey, { ...existing, queueFull: true, error: errorData.message || 'Queue is full, retrying...', queueStats: errorData.queueStats });
            return newMap;
          });

          let retryDelay = 2000;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            setRunning(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(runningKey) || {};
              newMap.set(runningKey, { ...existing, error: `Retrying... (attempt ${retryCount + 1}/${maxRetries})` });
              return newMap;
            });

            const retryResponse = await fetch(`${apiUrl}/api/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: targetUrl, deviceType: dev }),
            });

            if (retryResponse.status !== 429) {
              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Analysis failed');
              }
              const data = await retryResponse.json();
              await addReport(data);
              await loadHistory();
              clearInterval(pollIntervalId);
              return;
            }
            retryCount++;
            retryDelay *= 2;
          }
          clearInterval(pollIntervalId);
          throw new Error('Queue is full. Please try again later.');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          clearInterval(pollIntervalId);
          throw new Error(errorData.error || 'Analysis failed');
        }

        const data = await response.json();
        await addReport(data);
        await loadHistory();
        clearInterval(pollIntervalId);
      } catch (err) {
        clearInterval(pollIntervalId);
        setRunning(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(runningKey) || {};
          newMap.set(runningKey, { ...existing, error: err.message });
          return newMap;
        });
      } finally {
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
    return setInterval(async () => {
      try {
        if (!running.get(runningKey)) return;
        const response = await fetch(`${apiUrl}/api/queue-stats`);
        if (!response.ok) return;
        const stats = await response.json();
        setRunning(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(runningKey);
          if (existing) newMap.set(runningKey, { ...existing, queueStats: stats });
          return newMap;
        });
      } catch (err) {
        console.error('Error polling queue stats:', err);
      }
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setUrl('');
    await runAnalysis(normalizeUrl(trimmedUrl));
  };

  const handleRefresh = async (urlToRefresh, reportDeviceType = 'desktop') => {
    await runAnalysis(normalizeUrl(urlToRefresh), reportDeviceType);
  };

  const handleDelete = async (id) => {
    await deleteReport(id);
    await loadHistory();
  };

  const saveApiSettings = () => {
    localStorage.setItem('apiEndpoint', apiEndpoint);
    localStorage.setItem('customApiUrl', customApiUrl);
    setShowSettings(false);
  };

  return (
    <main class="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto">
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        apiEndpoint={apiEndpoint}
        setApiEndpoint={setApiEndpoint}
        customApiUrl={customApiUrl}
        setCustomApiUrl={setCustomApiUrl}
        onSave={saveApiSettings}
      />

      <header class="mb-10">
        <div class="flex justify-between items-center mb-4">
          <a href="/" class="p-2 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Back to home">
            <Home size={20} />
          </a>
          <div class="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)} class="p-2 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Settings">
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

      <QueueStatusBanner stats={globalQueueStats} />

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
            <DeviceButton id="desktop" label="Desktop" icon={Monitor} isActive={deviceType === 'desktop'} onClick={() => setDeviceType('desktop')} />
            <DeviceButton id="mobile" label="Mobile" icon={Smartphone} isActive={deviceType === 'mobile'} onClick={() => setDeviceType('mobile')} />
            <DeviceButton id="both" label="Both" icon={Activity} isActive={deviceType === 'both'} onClick={() => setDeviceType('both')} />
          </div>
        </form>
      </section>

      <ActiveRequests running={running} now={now} globalQueueStats={globalQueueStats} />

      <HistorySection
        history={history}
        running={running}
        onRefresh={handleRefresh}
        onDelete={handleDelete}
        onRunAnalysis={runAnalysis}
      />

      <Footer />
    </main>
  );
}
