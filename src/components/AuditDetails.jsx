import { useState } from 'preact/hooks';
import { AlertCircle, Copy, CheckCheck, ChevronDown } from 'lucide-preact';

export function AuditDetails({ category, audits }) {
  if (audits === undefined) {
    return (
      <div class="mt-2 p-4 bg-surface border border-[var(--color-border)] rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
        <p class="text-yellow-500 dark:text-yellow-400 text-sm mb-1">Audit details not available</p>
        <p class="text-xs text-[var(--color-text-muted)]">This report was created before detailed audit tracking was added. Click the refresh button to run a new analysis and see detailed issues.</p>
      </div>
    );
  }

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
  const [copiedGroupSummary, setCopiedGroupSummary] = useState(null);

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

  const getScoreTextForCopy = (audit) => {
    const mode = audit.scoreDisplayMode;
    const score = audit.score;
    if (mode === 'manual') return 'Pass (verify manually)';
    if (mode === 'informative' || mode === 'notApplicable') return 'Info';
    if (score === null) return 'Failed (critical issue)';
    if (score === 0) return 'Failed';
    return `${Math.round(score)}`;
  };

  const isRealFailure = (audit) => {
    // Manual, informative, notApplicable are not real failures
    const mode = audit.scoreDisplayMode;
    if (mode === 'manual' || mode === 'informative' || mode === 'notApplicable') return false;
    return audit.score === null || audit.score === 0;
  };

  const copyFailedAuditsSummary = async () => {
    const failedAudits = audits.filter(isRealFailure);
    if (failedAudits.length === 0) return;

    const summary = failedAudits.map((audit, index) => {
      let text = `${index + 1}. ${audit.title}\n`;
      text += `   Score: ${getScoreTextForCopy(audit)}\n`;
      if (audit.description) {
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

  const hasFailedAudits = audits.some(isRealFailure);

  const formatGroupName = (group) => {
    if (!group || group === 'hidden' || group === 'other') return 'Other';
    return group
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/a11y/gi, 'A11y')
      .replace(/Seo/gi, 'SEO');
  };

  const groupedAudits = audits.reduce((acc, audit) => {
    const group = audit.group || 'other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(audit);
    return acc;
  }, {});

  const groupOrder = ['metrics', 'diagnostics'];
  const sortedGroups = Object.keys(groupedAudits).sort((a, b) => {
    const aIndex = groupOrder.indexOf(a);
    const bIndex = groupOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const [expandedGroups, setExpandedGroups] = useState(new Set(sortedGroups));

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

  const copyGroupSummary = async (group, groupName) => {
    const groupAudits = groupedAudits[group] || [];
    if (groupAudits.length === 0) return;

    const summary = groupAudits.map((audit, index) => {
      let text = `${index + 1}. ${audit.title}\n`;
      text += `   Score: ${getScoreTextForCopy(audit)}\n`;
      if (audit.description) {
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

    const fullSummary = `${category} - ${groupName} Summary (${groupAudits.length} ${groupAudits.length === 1 ? 'item' : 'items'})\n${'='.repeat(50)}\n\n${summary}`;

    try {
      await navigator.clipboard.writeText(fullSummary);
      setCopiedGroupSummary(group);
      setTimeout(() => setCopiedGroupSummary(null), 2000);
    } catch (err) {
      console.error('Failed to copy group summary:', err);
    }
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
        const groupAuditsList = groupedAudits[group];
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
                  {groupName} ({groupAuditsList.length})
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
                {groupAuditsList.map((audit) => (
                  <AuditCard
                    key={audit.id}
                    audit={audit}
                    copiedId={copiedId}
                    onCopy={copyAuditToClipboard}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AuditCard({ audit, copiedId, onCopy }) {
  const renderScoreBadge = () => {
    const mode = audit.scoreDisplayMode;
    const score = audit.score;

    // Manual audits - best practices to verify (show as passing)
    if (mode === 'manual') {
      return (
        <span class="text-xs font-medium px-2 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400" title="Best practice - verify manually">
          Pass
        </span>
      );
    }

    // Informative or not applicable - just info, no judgment
    if (mode === 'informative' || mode === 'notApplicable') {
      return (
        <span class="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 dark:text-blue-400" title={mode === 'informative' ? 'Informational' : 'Not applicable'}>
          Info
        </span>
      );
    }

    // For metricSavings, binary, numeric - show actual score or fail state
    if (score === null) {
      return (
        <span class="flex items-center justify-center text-red-600 dark:text-red-400" title="Critical issue - requires attention">
          <AlertCircle size={16} />
        </span>
      );
    }

    // Score 0 = fail (red), otherwise color by score
    if (score === 0) {
      return (
        <span class="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400" title="Failed - needs attention">
          Fail
        </span>
      );
    }

    // Score > 0 - show numeric with color coding
    const colorClass = score >= 90
      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
      : score >= 50
        ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
        : 'bg-red-500/20 text-red-600 dark:text-red-400';

    return (
      <span class={`text-xs font-bold px-2 py-0.5 rounded ${colorClass}`}>
        {Math.round(score)}
      </span>
    );
  };

  return (
    <div class="p-3 bg-background rounded border border-[var(--color-border)] relative group">
      <div class="flex items-start justify-between gap-2 mb-2">
        <h5 class="text-sm font-medium text-[var(--color-text)] flex-1">{audit.title}</h5>
        <div class="flex items-center gap-1">
          {renderScoreBadge()}
          <button
            onClick={() => onCopy(audit)}
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
  );
}
