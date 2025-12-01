import { Sun, Moon, Monitor } from 'lucide-preact';

const themes = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ theme, setTheme }) {
  return (
    <div class="flex items-center gap-1 p-1 bg-surface rounded-xl border border-[var(--color-border)]">
      {themes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          class={`p-2 rounded-lg transition-all ${
            theme === id
              ? 'bg-primary/20 text-primary'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-surface'
          }`}
          aria-label={`Switch to ${label} theme`}
          title={label}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
}
