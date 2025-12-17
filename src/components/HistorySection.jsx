import { useState } from 'preact/hooks';
import { History as HistoryIcon, RefreshCw, Trash2, X, Check, ChevronDown, Smartphone, Monitor } from 'lucide-preact';
import { normalizeUrl, displayUrl, getDomain } from '../utils/url';
import { Badge } from './Badge';
import { RetryDropdown } from './RetryDropdown';
import { AuditDetails } from './AuditDetails';

export function HistorySection({
  history,
  running,
  onRefresh,
  onDelete,
  onRunAnalysis,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [expandedThumbnail, setExpandedThumbnail] = useState(null);
  const [expandedAudits, setExpandedAudits] = useState(new Map());
  const [expandedDomains, setExpandedDomains] = useState(new Set());

  const groupedHistory = (() => {
    const groups = new Map();
    for (const report of history) {
      const domain = getDomain(report.url);
      if (!groups.has(domain)) {
        groups.set(domain, { domain, latest: report, pastRuns: [] });
      } else {
        groups.get(domain).pastRuns.push(report);
      }
    }
    return Array.from(groups.values());
  })();

  const handleDeleteClick = (id) => setDeletingId(id);
  const handleDeleteConfirm = async (id) => {
    await onDelete(id);
    setDeletingId(null);
  };
  const handleDeleteCancel = () => setDeletingId(null);

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
                    newMap.delete(`${report.id}-performance`);
                    newMap.delete(`${report.id}-accessibility`);
                    newMap.delete(`${report.id}-best-practices`);
                    newMap.delete(`${report.id}-seo`);
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

          <div class="flex items-center gap-1 flex-shrink-0">
            <RetryDropdown
              reportId={report.id}
              currentDeviceType={rDeviceType}
              onRetry={(deviceType) => onRefresh(report.url, deviceType)}
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
    <section aria-labelledby="history-heading">
      <div class="flex items-center justify-between mb-6">
        <h2 id="history-heading" class="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
          <HistoryIcon size={24} />
          History
        </h2>
        {groupedHistory.length > 0 && (
          <button
            onClick={() => {
              groupedHistory.forEach(({ latest }) => {
                const targetUrl = normalizeUrl(latest.url);
                const targetDevice = latest.deviceType || 'desktop';
                onRunAnalysis(targetUrl, targetDevice);
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

            return (
              <div key={domain} class="bg-surface rounded-xl border border-[var(--color-border)] hover:border-primary/50 transition-colors">
                <div class="p-4">
                  {renderReportRow(latest, false)}
                </div>

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
  );
}
