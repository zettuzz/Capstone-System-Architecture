'use client';

import { useLLMProvider, type LLMProvider } from '@/components/LLMProviderContext';

const PROVIDERS: { key: LLMProvider; label: string; model: string }[] = [
  { key: "openrouter", label: "OPENROUTER", model: "nemotron-3-ultra" },
  { key: "nvidia", label: "NVIDIA", model: "nemotron-super-49b" },
];

export default function LLMProviderSwitch() {
  const { provider, setProvider } = useLLMProvider();

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.1em] px-1">
        LLM Provider
      </p>
      <div className="flex gap-1">
        {PROVIDERS.map((p) => (
          <button
            key={p.key}
            onClick={() => setProvider(p.key)}
            title={p.model}
            className={`flex-1 px-2 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wide transition-all duration-150 border ${
              provider === p.key
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-text-muted border-surface-border hover:border-white/30 hover:text-text-main'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-[9px] font-mono text-text-muted px-1 truncate">
        {PROVIDERS.find(p => p.key === provider)?.model}
      </p>
    </div>
  );
}
