import { AlertCircle, Activity, Check } from 'lucide-preact';

export function QueueStatusBanner({ stats }) {
  if (!stats) return null;

  if (stats.activeCount >= stats.maxConcurrent && stats.queueLength > 0) {
    return (
      <div class="mb-6 max-w-2xl mx-auto">
        <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div class="flex items-center gap-3">
            <AlertCircle size={20} class="text-yellow-400 flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm font-medium text-yellow-400">Queue is busy</p>
              <p class="text-xs text-[var(--color-text-muted)] mt-1">
                {stats.activeCount} analysis running, {stats.queueLength} waiting in queue
                {stats.queueLength > 0 && (
                  <span> • Estimated wait: ~{Math.ceil((stats.queueLength * 30000) / 1000)}s</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stats.activeCount > 0) {
    return (
      <div class="mb-6 max-w-2xl mx-auto">
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div class="flex items-center gap-3">
            <Activity size={20} class="text-blue-400 flex-shrink-0 animate-pulse" />
            <div class="flex-1">
              <p class="text-sm font-medium text-blue-400">System is processing</p>
              <p class="text-xs text-[var(--color-text-muted)] mt-1">
                {stats.activeCount} analysis running • Queue is available
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="mb-6 max-w-2xl mx-auto">
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
    </div>
  );
}
