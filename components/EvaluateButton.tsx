'use client';

interface EvaluateButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export default function EvaluateButton({ onClick, loading }: EvaluateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="fixed top-4 right-6 z-20 bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-mono font-bold text-[13px] px-6 py-2 rounded-none transition-all duration-200 active:scale-95 flex items-center gap-2 border border-white"
    >
      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 600 'GRAD' 0 'opsz' 20" }}>
        {loading ? 'hourglass_empty' : 'auto_awesome'}
      </span>
      {loading ? 'Evaluating...' : 'EVALUATE'}
    </button>
  );
}
