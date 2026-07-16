'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    // Navigate to chat page with the idea as state
    router.push(`/chat?idea=${encodeURIComponent(input)}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative antialiased selection:bg-white selection:text-black">
      <main className="w-full max-w-[960px] px-6 flex flex-col items-center justify-center z-10">
        {/* Hero Title */}
        <h1 className="font-display text-[48px] font-bold tracking-[-0.02em] leading-tight mb-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-center">
          Architect your capstone.
        </h1>
        {/* Master Input Container */}
        <div className="w-full max-w-[640px] relative group">
          <div className="sharp-panel sharp-input rounded-none flex items-center h-[56px] w-full px-4 transition-all duration-200">
            {/* Icon */}
            <span aria-hidden="true" className="material-symbols-outlined text-text-muted mr-3 select-none" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
              terminal
            </span>
            {/* Input Field */}
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
        {/* Prompt Suggestions */}
        <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-[640px]">
          <button
            onClick={() => setInput('AI-powered study planner')}
            className="terminal-pill rounded-none px-4 py-2 text-[13px] text-text-muted font-mono flex items-center gap-2 cursor-pointer outline-none focus:ring-1 focus:ring-white"
          >
            AI-powered study planner
          </button>
          <button
            onClick={() => setInput('IoT campus parking')}
            className="terminal-pill rounded-none px-4 py-2 text-[13px] text-text-muted font-mono flex items-center gap-2 cursor-pointer outline-none focus:ring-1 focus:ring-white"
          >
            IoT campus parking
          </button>
          <button
            onClick={() => setInput('Blockchain voting system')}
            className="terminal-pill rounded-none px-4 py-2 text-[13px] text-text-muted font-mono flex items-center gap-2 cursor-pointer outline-none focus:ring-1 focus:ring-white"
          >
            Blockchain voting system
          </button>
        </div>
        {loading && (
          <div className="mt-4 text-text-muted font-mono text-sm">
            Loading...
          </div>
        )}
      </main>
    </div>
  );
}