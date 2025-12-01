export function ScoreCard({ label, score }) {
  // Colors based on score ranges
  let colorClass = 'text-red-500';
  if (score >= 90) colorClass = 'text-green-500';
  else if (score >= 50) colorClass = 'text-yellow-500';

  // SVG Circle calculations
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div class="flex flex-col items-center p-4 bg-surface rounded-xl shadow-lg">
      <div class="relative w-24 h-24 flex items-center justify-center mb-2">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            class="text-slate-700"
            stroke-width="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            class={`${colorClass} transition-all duration-1000 ease-out`}
            stroke-width="8"
            stroke-dasharray={circumference}
            stroke-dashoffset={strokeDashoffset}
            stroke-linecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
        </svg>
        <span class={`absolute text-2xl font-bold ${colorClass}`}>
          {Math.round(score)}
        </span>
      </div>
      <span class="text-sm font-medium text-slate-300 uppercase tracking-wider text-center">
        {label}
      </span>
    </div>
  );
}

