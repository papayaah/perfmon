export function SettingsModal({ show, onClose, apiEndpoint, setApiEndpoint, customApiUrl, setCustomApiUrl, onSave }) {
  if (!show) return null;

  return (
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
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
            <p class="text-xs text-blue-400 font-medium mb-1">Tip: Use ngrok for localhost</p>
            <p class="text-xs text-[var(--color-text-muted)]">
              Expose your local site with: <code class="bg-background px-1 py-0.5 rounded">ngrok http 5173</code>
              <br/>Then analyze the ngrok URL with Cloud API
            </p>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            onClick={onSave}
            class="flex-1 bg-primary text-background px-4 py-2 rounded-lg hover:bg-green-400 transition-colors font-medium"
          >
            Save
          </button>
          <button
            onClick={onClose}
            class="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-primary/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
