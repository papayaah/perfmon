export function Badge({ label, score, onClick, isExpanded }) {
  let colorClass = 'bg-red-500/20 text-red-400 border-red-500/30';
  if (score >= 90) colorClass = 'bg-green-500/20 text-green-400 border-green-500/30';
  else if (score >= 50) colorClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  return (
    <button
      onClick={onClick}
      class={`flex flex-col items-center justify-center px-2 py-1 rounded border ${colorClass} min-w-[3.5rem] transition-all hover:scale-105 cursor-pointer ${
        isExpanded ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
      aria-label={`${label} score: ${Math.round(score)}. Click to ${isExpanded ? 'collapse' : 'expand'} details`}
    >
      <span class="text-xs font-bold">{Math.round(score)}</span>
      <span class="text-[0.6rem] uppercase opacity-80">{label}</span>
    </button>
  );
}
