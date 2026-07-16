'use client';

import Sidebar from '@/components/Sidebar';

export default function ChatLoading() {
  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* AI welcome skeleton */}
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-none sharp-panel flex items-center justify-center shrink-0 text-white">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>smart_toy</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">Terminal_AI</span>
              <div className="flex flex-col gap-2 mt-1">
                <div className="h-[14px] w-[320px] bg-surface-highlight rounded-none animate-pulse" />
                <div className="h-[14px] w-[260px] bg-surface-highlight rounded-none animate-pulse" />
                <div className="h-[14px] w-[290px] bg-surface-highlight rounded-none animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="w-full p-6 bg-background-dark border-t border-surface-border">
          <div className="sharp-panel sharp-input rounded-none flex items-center w-full min-h-[56px] px-4">
            <span className="material-symbols-outlined text-text-muted mr-3 select-none" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
              terminal
            </span>
            <div className="flex-1 h-[14px] bg-surface-highlight rounded-none animate-pulse my-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
