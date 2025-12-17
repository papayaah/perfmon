import { Linkedin, Twitter, MessageCircle, Code } from 'lucide-preact';

export function Footer() {
  return (
    <footer class="mt-16 pt-8 border-t border-[var(--color-border)]">
      <div class="text-center">
        <p class="text-sm text-[var(--color-text-muted)] mb-4">
          If this tool saved you some time, consider following me for more projects
        </p>
        <div class="flex justify-center gap-4 flex-wrap">
          <a
            href="https://www.linkedin.com/in/david-ang-0932bb4a/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
            title="Follow on LinkedIn"
          >
            <Linkedin size={18} />
            <span class="text-sm">LinkedIn</span>
          </a>
          <a
            href="https://x.com/papayaahtries"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
            title="Follow on X"
          >
            <Twitter size={18} />
            <span class="text-sm">X</span>
          </a>
          <a
            href="https://www.reddit.com/user/Prize-Coyote-6989/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
            title="Follow on Reddit"
          >
            <MessageCircle size={18} />
            <span class="text-sm">Reddit</span>
          </a>
          <a
            href="https://devpost.com/software/perfmon"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-[var(--color-text-muted)] hover:border-primary hover:text-primary hover:bg-primary/10 transition-all"
            title="Check out on Devpost"
          >
            <Code size={18} />
            <span class="text-sm">Devpost</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
