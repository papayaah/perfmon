export function DeviceButton({ id, label, icon: Icon, isActive, onClick }) {
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
