'use client';

import { useState } from 'react';
import { useLLMProvider, type LLMProvider } from '@/components/LLMProviderContext';

interface APIKeyPromptProps {
  onClose: () => void;
  blockedProvider?: LLMProvider;
}

const PROVIDERS: { key: LLMProvider; label: string; placeholder: string; getKeyUrl: string }[] = [
  { key: "nvidia", label: "NVIDIA", placeholder: "nvapi-...", getKeyUrl: "https://build.nvidia.com/nim.extract/api-key" },
  { key: "openrouter", label: "OPENROUTER", placeholder: "sk-or-v1-...", getKeyUrl: "https://openrouter.ai/settings/keys" },
];

export default function APIKeyPrompt({ onClose, blockedProvider }: APIKeyPromptProps) {
  const { userKeys, setUserKeys, provider, setProvider } = useLLMProvider();
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(blockedProvider || provider);
  const [keyInput, setKeyInput] = useState(userKeys[blockedProvider || provider] || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeConfig = PROVIDERS.find(p => p.key === selectedProvider)!;

  const handleProviderSwitch = (newProvider: LLMProvider) => {
    setSelectedProvider(newProvider);
    setKeyInput(userKeys[newProvider] || "");
  };

  const handleSave = () => {
    setSaving(true);
    const updatedKeys = { ...userKeys, [selectedProvider]: keyInput.trim() };
    setUserKeys(updatedKeys);
    setProvider(selectedProvider);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(onClose, 800);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[480px] bg-surface border border-surface-border p-6 space-y-5">
        <div className="space-y-2">
          <h2 className="text-white font-mono text-[16px] font-bold tracking-tight">
            {saved ? "API Key Saved" : "Configure Your API Key"}
          </h2>
          <p className="text-text-muted font-mono text-[12px] leading-relaxed">
            {saved
              ? "Your key has been saved. Closing..."
              : `Enter your own API key to continue using CapstoneAI.`}
          </p>
        </div>

        {!saved && (
          <>
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.1em] px-1">
                Provider
              </p>
              <div className="flex gap-1">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleProviderSwitch(p.key)}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wide transition-all duration-150 border ${
                      selectedProvider === p.key
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-text-muted border-surface-border hover:border-white/30 hover:text-text-main'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                {activeConfig.label} API Key
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={activeConfig.placeholder}
                className="w-full bg-surface-highlight border border-surface-border text-text-main text-[13px] font-mono p-2.5 outline-none focus:border-white/30 placeholder:text-text-muted"
              />
              <a
                href={activeConfig.getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-text-muted hover:text-white underline underline-offset-2 decoration-white/20 hover:decoration-white/60 transition-colors"
              >
                Get key at {activeConfig.getKeyUrl.replace('https://', '')}
              </a>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !keyInput.trim()}
                className="flex-1 px-4 py-2.5 bg-white text-black font-mono text-[12px] font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save & Switch"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-surface-border text-text-muted font-mono text-[12px] uppercase tracking-wider hover:text-white hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
