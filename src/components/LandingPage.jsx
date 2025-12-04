import { Activity, Zap, History, Smartphone, BarChart3, Shield, Clock, ArrowRight } from 'lucide-preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { Fireworks as FireworksJS } from 'fireworks-js';

export function LandingPage({ onGetStarted }) {
  return (
    <div class="min-h-screen bg-background">
      {/* Fixed Header */}
      <header class="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-[var(--color-border)]" role="banner">
        <div class="max-w-6xl mx-auto px-4 py-4">
          <nav class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Activity size={32} class="text-primary" />
              <span class="text-2xl font-bold text-[var(--color-text)]">PerfMon</span>
            </div>
            <button
              onClick={onGetStarted}
              class="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Launch App
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
      {/* Hero Section */}
      <section class="relative overflow-hidden pt-24">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div class="max-w-6xl mx-auto px-4 py-8">

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
              Making the internet fast for everyone. Track performance, accessibility,
              and best practices with instant Lighthouse audits.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-700 text-white rounded-xl font-semibold text-lg hover:bg-green-600 transition-all hover:scale-105 shadow-lg shadow-green-700/25"
              >
                Start Analyzing
                <ArrowRight size={20} />
              </button>
              <a
                href="https://github.com/papayaah/perfmon"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-surface border border-[var(--color-border)] text-[var(--color-text)] rounded-xl font-semibold text-lg hover:border-primary/50 transition-all"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

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
              <ScoresDemo />
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

      {/* Getting Started Section */}
      <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              Get Started Locally
            </h2>
            <p class="text-[var(--color-text-muted)] text-lg max-w-2xl mx-auto">
              Clone the repo and run PerfMon on your machine. Perfect for testing localhost URLs during development.
            </p>
          </div>

          <div class="max-w-3xl mx-auto bg-surface rounded-2xl border border-[var(--color-border)] p-8">
            <div class="space-y-6">
              <div class="flex gap-4">
                <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-[var(--color-text)] mb-2">Clone the repository</h3>
                  <div class="bg-background rounded-lg p-4 border border-[var(--color-border)] font-mono text-sm text-[var(--color-text-muted)]">
                    git clone https://github.com/papayaah/perfmon.git
                  </div>
                </div>
              </div>

              <div class="flex gap-4">
                <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-[var(--color-text)] mb-2">Install dependencies</h3>
                  <div class="bg-background rounded-lg p-4 border border-[var(--color-border)] font-mono text-sm text-[var(--color-text-muted)]">
                    cd perfmon && npm install
                  </div>
                </div>
              </div>

              <div class="flex gap-4">
                <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-[var(--color-text)] mb-2">Start the app</h3>
                  <div class="bg-background rounded-lg p-4 border border-[var(--color-border)] font-mono text-sm text-[var(--color-text-muted)]">
                    npm run dev
                  </div>
                  <p class="text-sm text-[var(--color-text-muted)] mt-2">
                    This starts both the Lighthouse server and the web interface at localhost:5173
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-8 pt-8 border-t border-[var(--color-border)]">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <span class="text-primary text-xs">ℹ</span>
                </div>
                <p class="text-sm text-[var(--color-text-muted)]">
                  <span class="font-semibold text-[var(--color-text)]">Note:</span> Desktop app and online management features are coming soon. For now, run PerfMon locally to analyze your websites.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer class="py-8 px-4 border-t border-[var(--color-border)]" role="contentinfo">
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

function ScoresDemo() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          // Trigger fireworks after counting completes (1.5s)
          setTimeout(() => setShowFireworks(true), 1500);
          // Disconnect observer after first animation
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []); // Empty dependency array - only run once

  return (
    <div ref={sectionRef} class="flex gap-4 justify-center relative">
      {showFireworks && <Fireworks />}
      <AnimatedScorePreview label="Perf" targetScore={100} hasAnimated={hasAnimated} delay={0} />
      <AnimatedScorePreview label="A11y" targetScore={100} hasAnimated={hasAnimated} delay={200} />
      <AnimatedScorePreview label="Best" targetScore={100} hasAnimated={hasAnimated} delay={400} />
      <AnimatedScorePreview label="SEO" targetScore={100} hasAnimated={hasAnimated} delay={600} />
    </div>
  );
}

function Fireworks() {
  const containerRef = useRef(null);
  const fireworksRef = useRef(null);
  const launchCountRef = useRef(0);
  const maxLaunches = 10;

  useEffect(() => {
    if (!containerRef.current) return;

    // Schedule random bursts of 1-3 fireworks
    const scheduleBursts = () => {
      let totalScheduled = 0;
      const timeouts = [];

      while (totalScheduled < maxLaunches) {
        // Random burst size: 1-3 fireworks
        const burstSize = Math.min(
          Math.floor(Math.random() * 3) + 1,
          maxLaunches - totalScheduled
        );
        
        // Random delay between bursts (300-800ms)
        const burstDelay = totalScheduled === 0 ? 0 : 300 + Math.random() * 500;
        
        timeouts.push(
          setTimeout(() => {
            if (fireworksRef.current) {
              // Launch burst
              for (let i = 0; i < burstSize; i++) {
                setTimeout(() => {
                  if (launchCountRef.current < maxLaunches) {
                    fireworksRef.current.launch(1);
                    launchCountRef.current++;
                  }
                }, i * (50 + Math.random() * 100)); // Small delay between fireworks in burst
              }
            }
          }, totalScheduled === 0 ? 0 : timeouts.reduce((sum, t) => sum, 0) + burstDelay)
        );
        
        totalScheduled += burstSize;
      }

      return timeouts;
    };

    // Initialize fireworks
    fireworksRef.current = new FireworksJS(containerRef.current, {
      autoresize: true,
      opacity: 0.5,
      acceleration: 1.02,
      friction: 0.98,
      gravity: 1.2,
      particles: 50,
      traceLength: 2,
      traceSpeed: 6,
      explosion: 4,
      flickering: 30,
      lineStyle: 'round',
      hue: {
        min: 0,
        max: 360
      },
      saturation: {
        min: 50,
        max: 100
      },
      rocketsPoint: {
        min: 50,
        max: 50
      },
      lineWidth: {
        explosion: {
          min: 0.5,
          max: 1.5
        },
        trace: {
          min: 0.5,
          max: 1
        }
      },
      brightness: {
        min: 60,
        max: 90
      },
      decay: {
        min: 0.01,
        max: 0.02
      },
      mouse: {
        click: false,
        move: false,
        max: 1
      }
    });

    fireworksRef.current.start();
    
    // Pause automatic launches
    fireworksRef.current.pause();
    
    // Schedule our controlled bursts
    const timeouts = scheduleBursts();

    return () => {
      timeouts.forEach(clearTimeout);
      if (fireworksRef.current) {
        fireworksRef.current.stop();
        fireworksRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      class="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

function AnimatedScorePreview({ label, targetScore, hasAnimated, delay }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!hasAnimated || hasRun) return;

    setHasRun(true);
    const timeout = setTimeout(() => {
      const duration = 1200;
      const steps = 60;
      const increment = targetScore / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current = Math.min(Math.round(step * increment), targetScore);
        setDisplayScore(current);

        if (current >= targetScore) {
          clearInterval(timer);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [hasAnimated, hasRun, targetScore, delay]);

  const color = displayScore === 100 ? 'green' : displayScore >= 90 ? 'yellow' : 'red';
  const colorClasses = {
    green: 'bg-green-500/20 text-green-700 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    red: 'bg-red-500/20 text-red-700 border-red-500/30',
  };

  return (
    <div class={`flex flex-col items-center justify-center px-4 py-3 rounded-lg border ${colorClasses[color]} min-w-[4rem] relative z-10 transition-all duration-300`}>
      <span class="text-2xl font-bold">{displayScore}</span>
      <span class="text-xs uppercase font-bold">{label}</span>
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


