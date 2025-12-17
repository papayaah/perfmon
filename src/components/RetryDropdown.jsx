import { useState } from 'preact/hooks';
import { RefreshCw, ChevronDown, Smartphone, Monitor } from 'lucide-preact';

export function RetryDropdown({ reportId, currentDeviceType, onRetry, isRunning, disabled }) {
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
