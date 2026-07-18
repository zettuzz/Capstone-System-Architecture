'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLLMProvider } from '@/components/LLMProviderContext';
import { useAuth } from '@clerk/nextjs';
import { SignInButton, UserButton } from '@clerk/nextjs';

export default function Page() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const { provider, userKeys, canMakeRequest } = useLLMProvider();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const fetchSuggestions = async () => {
    const hasUserKey = !!userKeys[provider];
    if (!hasUserKey && !canMakeRequest()) {
      setSuggestions(['AI-powered study planner', 'IoT campus parking', 'Blockchain voting system']);
      setSuggestionsLoading(false);
      return;
    }

    const userApiKey = hasUserKey ? userKeys[provider] : undefined;

    setSuggestionsLoading(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, userApiKey }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions(['AI-powered study planner', 'IoT campus parking', 'Blockchain voting system']);
    }
    setSuggestionsLoading(false);
  };

  useEffect(() => {
    fetchSuggestions();
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent('/')}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input.trim() }),
      });
      const data = await res.json();
      if (data?.project?.id) {
        router.push(`/workspace?project=${data.project.id}`);
      } else {
        throw new Error('No project ID returned');
      }
    } catch {
      router.push(`/workspace?idea=${encodeURIComponent(input)}`);
    }
  };

  const refreshSuggestions = () => fetchSuggestions();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative antialiased selection:bg-white selection:text-black">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-end gap-2">
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-[11px] font-mono text-text-muted uppercase tracking-wider border border-surface-border hover:text-white hover:border-white/30 transition-colors">
              Sign In
            </button>
          </SignInButton>
        )}
        {isLoaded && isSignedIn && (
          <UserButton />
        )}
      </div>

      <main className="w-full max-w-[960px] px-6 flex flex-col items-center justify-center z-10">
        <h1 className="font-display text-[48px] font-bold tracking-[-0.02em] leading-tight mb-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-center">
          Architect your capstone.
        </h1>
        <div className="w-full max-w-[640px] relative group">
          <div className="sharp-panel sharp-input rounded-none flex items-center h-[56px] w-full px-4 transition-all duration-200">
            <span aria-hidden="true" className="material-symbols-outlined text-text-muted mr-3 select-none" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
              terminal
            </span>
            <input
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              className="w-full bg-transparent border-none text-text-main text-[14px] placeholder:text-text-muted focus:ring-0 p-0 h-full font-mono outline-none"
              placeholder="What's your project idea?"
              type="text"
              disabled={loading}
            />
            <div className="ml-3 flex items-center justify-center">
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              >
                <span className="text-[11px] font-mono text-text-muted uppercase tracking-[0.05em] flex items-center gap-1 bg-white/5 px-2 py-1 rounded-none border border-white/10">
                  EXE
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 600 'GRAD' 0 'opsz' 20" }}>
                    keyboard_return
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-[640px] min-h-[36px]">
          {suggestions.map((idea, i) => (
            <button
              key={`${idea}-${i}`}
              onClick={() => setInput(idea)}
              className="terminal-pill rounded-none px-4 py-2 text-[13px] text-text-muted font-mono cursor-pointer outline-none focus:ring-1 focus:ring-white animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {idea}
            </button>
          ))}
        </div>
        {!suggestionsLoading && (
          <button
            onClick={refreshSuggestions}
            className="mt-4 text-[12px] font-mono text-text-muted hover:text-text-main transition-colors cursor-pointer underline underline-offset-4 decoration-white/20 hover:decoration-white/60"
          >
            surprise me
          </button>
        )}
      </main>
    </div>
  );
}
