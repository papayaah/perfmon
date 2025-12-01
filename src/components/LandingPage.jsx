import { Activity, Zap, History, Smartphone, Monitor, BarChart3, Shield, Clock, ArrowRight, Download, Apple, Monitor as Windows } from 'lucide-preact';

export function LandingPage({ onGetStarted }) {
  return (
    <div class="min-h-screen bg-background">
      {/* Hero Section */}
      <header class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div class="max-w-6xl mx-auto px-4 py-8">
          <nav class="flex items-center justify-between mb-16">
            <div class="flex items-center gap-2">
              <Activity size={32} class="text-primary" />
              <span class="text-2xl font-bold text-[var(--color-text)]">PerfMon</span>
            </div>
            <button
              onClick={onGetStarted}
              class="px-4 py-2 bg-primary text-background rounded-lg font-medium hover:bg-green-400 transition-colors"
            >
              Launch App
            </button>
          </nav>

          <div class="text-center max-w-4xl mx-auto py-16">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-medium mb-8">
              <Zap size={16} />
              Powered by Google Lighthouse
            </div>

            <h1 class="text-5xl md:text-6xl font-bold text-[var(--color-text)] mb-6 leading-tight">
              Know Your Website's
              <span class="text-primary block">Performance Score</span>
            </h1>

            <p class="text-xl text-[var(--color-text-muted)] mb-10 max-w-2xl mx-auto">
              Instant Lighthouse audits for your web apps. Track performance, accessibility,
              best practices, and SEO scores over time. Perfect for developers who ship fast.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-background rounded-xl font-semibold text-lg hover:bg-green-400 transition-all hover:scale-105 shadow-lg shadow-primary/25"
              >
                Start Analyzing
                <ArrowRight size={20} />
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface border border-[var(--color-border)] text-[var(--color-text)] rounded-xl font-semibold text-lg hover:border-primary/50 transition-all"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Preview */}
      <section class="py-16 px-4">
        <div class="max-w-5xl mx-auto">
          <div class="bg-surface rounded-2xl border border-[var(--color-border)] p-6 shadow-2xl">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-3 h-3 rounded-full bg-red-500" />
              <div class="w-3 h-3 rounded-full bg-yellow-500" />
              <div class="w-3 h-3 rounded-full bg-green-500" />
              <span class="ml-4 text-sm text-[var(--color-text-muted)]">PerfMon Dashboard</span>
            </div>
            <div class="bg-background rounded-xl p-6 border border-[var(--color-border)]">
              <div class="flex items-center gap-4 mb-6">
                <div class="flex-1 h-12 bg-surface rounded-xl border border-[var(--color-border)] flex items-center px-4">
                  <span class="text-[var(--color-text-muted)]">localhost:5173</span>
                </div>
                <div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Activity size={24} class="text-background" />
                </div>
              </div>
              <div class="flex gap-4 justify-center">
                <ScorePreview label="Perf" score={98} color="green" />
                <ScorePreview label="A11y" score={92} color="green" />
                <ScorePreview label="Best" score={100} color="green" />
                <ScorePreview label="SEO" score={89} color="yellow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              Everything You Need
            </h2>
            <p class="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
              Built for developers who care about performance. Simple, fast, and actionable insights.
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Instant Analysis"
              description="Run Lighthouse audits in seconds. No configuration needed, just enter your URL and go."
            />
            <FeatureCard
              icon={History}
              title="History Tracking"
              description="Keep track of all your analyses. Compare scores over time and spot regressions early."
            />
            <FeatureCard
              icon={Smartphone}
              title="Mobile & Desktop"
              description="Test both mobile and desktop views. Run them simultaneously to save time."
            />
            <FeatureCard
              icon={BarChart3}
              title="Detailed Audits"
              description="Dive deep into each category. See exactly what's affecting your scores with actionable fixes."
            />
            <FeatureCard
              icon={Shield}
              title="Best Practices"
              description="Go beyond performance. Check accessibility, SEO, and security best practices."
            />
            <FeatureCard
              icon={Clock}
              title="Quick Presets"
              description="One-click testing for common dev ports. Perfect for rapid local development."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section class="py-20 px-4 bg-surface/50">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              How It Works
            </h2>
            <p class="text-[var(--color-text-muted)] text-lg">
              Three simple steps to better performance
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Enter URL"
              description="Type your localhost URL or any website address you want to analyze."
            />
            <StepCard
              number="2"
              title="Run Analysis"
              description="Click analyze and let Lighthouse do its magic. Takes about 30 seconds."
            />
            <StepCard
              number="3"
              title="Get Insights"
              description="Review your scores and detailed recommendations to improve your site."
            />
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              Download Desktop App
            </h2>
            <p class="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
              Get the native app for faster local testing. Test localhost URLs without any browser extensions.
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <DownloadCard
              icon={AppleIcon}
              platform="macOS"
              description="Intel & Apple Silicon"
              href="/downloads/PerfMon_macos.dmg"
            />
            <DownloadCard
              icon={WindowsIcon}
              platform="Windows"
              description="Windows 10/11"
              href="/downloads/PerfMon_windows.msi"
            />
            <DownloadCard
              icon={LinuxIcon}
              platform="Linux"
              description="AppImage & .deb"
              href="/downloads/PerfMon_linux.AppImage"
            />
          </div>

          <p class="text-center text-sm text-[var(--color-text-muted)] mt-8">
            Or use the web version above - no installation required!
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section class="py-20 px-4">
        <div class="max-w-4xl mx-auto text-center">
          <div class="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl p-12 border border-primary/30">
            <h2 class="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              Ready to Optimize?
            </h2>
            <p class="text-[var(--color-text-muted)] text-lg mb-8 max-w-xl mx-auto">
              Start monitoring your web performance today. Free, fast, and built for developers.
            </p>
            <button
              onClick={onGetStarted}
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-background rounded-xl font-semibold text-lg hover:bg-green-400 transition-all hover:scale-105 shadow-lg shadow-primary/25"
            >
              Launch PerfMon
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer class="py-8 px-4 border-t border-[var(--color-border)]">
        <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <Activity size={20} class="text-primary" />
            <span class="font-semibold text-[var(--color-text)]">PerfMon</span>
          </div>
          <p class="text-sm text-[var(--color-text-muted)]">
            Built with Preact, Tailwind CSS, and Google Lighthouse
          </p>
        </div>
      </footer>
    </div>
  );
}

function ScorePreview({ label, score, color }) {
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div class={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border ${colorClasses[color]} min-w-[4rem]`}>
      <span class="text-2xl font-bold">{score}</span>
      <span class="text-xs uppercase opacity-80">{label}</span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div class="bg-surface p-6 rounded-2xl border border-[var(--color-border)] hover:border-primary/50 transition-colors">
      <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
        <Icon size={24} class="text-primary" />
      </div>
      <h3 class="text-lg font-semibold text-[var(--color-text)] mb-2">{title}</h3>
      <p class="text-[var(--color-text-muted)] text-sm">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div class="text-center">
      <div class="w-16 h-16 bg-primary text-background rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 class="text-xl font-semibold text-[var(--color-text)] mb-2">{title}</h3>
      <p class="text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}

function DownloadCard({ icon: Icon, platform, description, href }) {
  return (
    <a
      href={href}
      class="flex flex-col items-center p-6 bg-surface rounded-2xl border border-[var(--color-border)] hover:border-primary/50 hover:bg-surface/80 transition-all group"
    >
      <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon size={32} class="text-primary" />
      </div>
      <h3 class="text-lg font-semibold text-[var(--color-text)] mb-1">{platform}</h3>
      <p class="text-sm text-[var(--color-text-muted)] mb-4">{description}</p>
      <span class="inline-flex items-center gap-2 text-primary text-sm font-medium">
        <Download size={16} />
        Download
      </span>
    </a>
  );
}

// Custom SVG icons for platforms
function AppleIcon({ size = 24, class: className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" class={className}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function WindowsIcon({ size = 24, class: className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" class={className}>
      <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm7 .25l10 .15V21l-10-1.91V13.25z"/>
    </svg>
  );
}

function LinuxIcon({ size = 24, class: className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" class={className}>
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667l.005.049a1.93 1.93 0 01-.08.6c-.035.13-.092.258-.166.378-.052.062-.116.122-.193.164a1.088 1.088 0 00-.057-.057 1.56 1.56 0 00-.255-.125 1.099 1.099 0 00-.134-.038c.04-.057.078-.116.107-.18a.862.862 0 00.078-.267v-.02c.01-.103.007-.2-.011-.3a.96.96 0 00-.108-.3 1.076 1.076 0 00-.166-.266c-.054-.06-.12-.072-.196-.072h-.017c-.075 0-.14.012-.195.072a1.067 1.067 0 00-.164.266.969.969 0 00-.106.3.843.843 0 00-.01.3v.02c.008.088.025.177.053.264-.072-.025-.145-.055-.218-.088-.08-.034-.16-.074-.238-.124-.053-.035-.097-.073-.127-.121a.77.77 0 01-.125-.29 1.667 1.667 0 01-.028-.374v-.02c.015-.27.061-.474.15-.674.082-.176.2-.334.347-.461a.875.875 0 01.4-.134zm2.77 1.96c.2 0 .394.068.561.2.168.133.3.332.377.535.088.266.105.535.075.805a2.214 2.214 0 01-.134.6.846.846 0 01-.218.334c.01.013.028.02.037.033.094.128.137.262.137.4 0 .136-.043.27-.137.4-.097.138-.226.267-.381.377-.155.112-.329.2-.513.264a1.953 1.953 0 01-.58.083c-.18-.003-.36-.04-.525-.113-.165-.074-.313-.18-.435-.317a.88.88 0 01-.24-.593c0-.194.072-.368.21-.51l.003-.003a.58.58 0 00.104-.133c-.097-.078-.175-.176-.228-.286a1.014 1.014 0 01-.11-.432c0-.09.01-.18.032-.27a.766.766 0 01.09-.207c.04-.074.1-.13.175-.169.075-.04.158-.04.234 0 .076.039.137.1.178.169.04.07.066.15.079.234.008.062.014.125.014.188 0 .07-.007.143-.028.21a.62.62 0 01-.078.18.506.506 0 01-.117.136c.088.075.18.135.28.176.099.044.202.066.307.066.108 0 .213-.022.315-.066.102-.044.198-.107.285-.183a.773.773 0 00.209-.296.849.849 0 00.083-.38c0-.15-.032-.295-.095-.43a.8.8 0 00-.268-.322.774.774 0 00-.406-.127h-.005c-.198 0-.38.087-.508.232l-.002.002a.588.588 0 00-.105.134c-.097-.079-.176-.177-.23-.287a1.014 1.014 0 01-.11-.432c0-.09.01-.18.033-.27a.77.77 0 01.089-.207c.04-.074.1-.13.175-.169.075-.04.157-.04.233 0 .076.039.137.1.178.169.04.07.066.15.08.234.007.062.013.125.013.188 0 .07-.006.143-.027.21a.622.622 0 01-.079.18.511.511 0 01-.116.136c.264.224.429.531.455.864.027.334-.087.662-.316.917a1.493 1.493 0 01-.48.35 1.64 1.64 0 01-.56.147h-.044l.028.012c.185.08.354.199.497.35.144.15.26.33.34.522.08.193.122.4.122.612 0 .213-.042.419-.122.612-.08.194-.196.372-.34.522-.144.153-.313.27-.498.351-.184.08-.383.121-.587.121-.203 0-.402-.04-.586-.121a1.558 1.558 0 01-.498-.35 1.651 1.651 0 01-.34-.523 1.627 1.627 0 01-.122-.612c0-.213.041-.42.122-.612.08-.193.196-.372.34-.522.144-.151.313-.27.497-.35l.03-.012h-.045a1.64 1.64 0 01-.56-.147 1.497 1.497 0 01-.48-.35 1.233 1.233 0 01-.316-.916c.027-.334.19-.64.455-.864a.51.51 0 01-.117-.137.622.622 0 01-.079-.179 1.086 1.086 0 01-.027-.21c0-.063.006-.126.014-.188.013-.084.04-.164.08-.234.04-.07.101-.13.177-.17a.242.242 0 01.234 0c.075.04.135.096.175.17.04.069.068.149.09.206.02.09.032.18.032.27 0 .156-.04.304-.11.432a.8.8 0 01-.229.287.585.585 0 00-.106-.134l-.002-.002a.676.676 0 00-.507-.232h-.005a.773.773 0 00-.406.127.8.8 0 00-.268.322.879.879 0 00-.095.43c0 .136.027.264.082.38a.78.78 0 00.21.296c.086.076.182.139.284.183.102.044.207.066.315.066.105 0 .208-.022.307-.066.1-.04.192-.1.28-.176a.51.51 0 01-.117-.137.618.618 0 01-.078-.179 1.06 1.06 0 01-.028-.21c0-.063.006-.126.013-.188.014-.084.04-.164.08-.234.04-.07.101-.13.177-.17a.242.242 0 01.234 0c.075.04.136.096.175.17.04.069.069.149.09.206.022.09.033.18.033.27 0 .156-.04.305-.11.433a.805.805 0 01-.229.286l.003.003a.581.581 0 00.105.133l.002.003c.14.142.211.316.211.51 0 .223-.081.425-.24.593a1.224 1.224 0 01-.435.317c-.165.073-.345.11-.525.113a1.95 1.95 0 01-.58-.083 2.004 2.004 0 01-.513-.264 1.555 1.555 0 01-.38-.377.844.844 0 01-.138-.4c0-.138.043-.272.137-.4.01-.013.027-.02.037-.033a.844.844 0 01-.218-.334 2.213 2.213 0 01-.134-.6 1.765 1.765 0 01.075-.805c.077-.203.209-.402.378-.535a.898.898 0 01.56-.2z"/>
    </svg>
  );
}
