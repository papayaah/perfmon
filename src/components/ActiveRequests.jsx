import { Activity, AlertCircle } from 'lucide-preact';
import { displayUrl } from '../utils/url';

export function ActiveRequests({ running, now, globalQueueStats }) {
  if (running.size === 0) return null;

  return (
    <section class="mb-12" aria-labelledby="running-heading">
      <h2 id="running-heading" class="text-2xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
        <Activity size={24} class="animate-pulse" />
        Active Requests ({running.size})
      </h2>
      <div class="space-y-3">
        {Array.from(running.entries())
          .sort(([, a], [, b]) => a.startTime - b.startTime)
          .map(([runningKey, state], index) => {
            const [runningUrl, devType] = runningKey.split('|');
            const stats = globalQueueStats || state.queueStats;
            const hasStats = !!stats;

            const maxConcurrent = hasStats ? stats.maxConcurrent : 1;
            const activeCount = hasStats ? stats.activeCount : 0;
            const queueLength = hasStats ? stats.queueLength : 0;

            const activeWorker = hasStats && stats.workers?.find(w =>
              w.busy && w.currentJob?.url === runningUrl
            );
            const isActiveOnWorker = !!activeWorker;

            const processingStartTime = activeWorker?.currentJob?.startedAt
              ? new Date(activeWorker.currentJob.startedAt).getTime()
              : null;

            let isLikelyProcessing = false;
            let isQueued = false;

            if (isActiveOnWorker) {
              isLikelyProcessing = true;
            } else if (!hasStats) {
              isLikelyProcessing = index === 0;
            } else {
              if (index < activeCount) {
                isLikelyProcessing = true;
              } else if (queueLength > 0 && index >= activeCount) {
                isQueued = true;
              } else if (index < maxConcurrent) {
                isLikelyProcessing = true;
              } else {
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
                  <div class="ml-4 text-yellow-400 text-2xl">...</div>
                )}
              </div>
            );
          })}
      </div>
    </section>
  );
}
