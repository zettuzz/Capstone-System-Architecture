'use client';

import Sidebar from '@/components/Sidebar';

export default function ResultLoading() {
  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="fixed top-4 right-6 z-20 bg-white/10 text-white/20 font-mono font-bold text-[13px] px-6 py-2 rounded-none border border-white/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Download
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[800px] mx-auto space-y-6">
            <div className="sharp-panel p-6">
              <div className="h-[12px] w-[200px] bg-surface-highlight rounded-none animate-pulse mb-4" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-[80px] bg-surface-highlight rounded-none animate-pulse" />
                <div className="h-[80px] bg-surface-highlight rounded-none animate-pulse" />
                <div className="h-[80px] bg-surface-highlight rounded-none animate-pulse" />
              </div>
            </div>
            <div className="sharp-panel p-6">
              <div className="h-[18px] w-[180px] bg-surface-highlight rounded-none animate-pulse mb-4" />
              <div className="h-[12px] w-[260px] bg-surface-highlight rounded-none animate-pulse mb-3" />
              <div className="space-y-2">
                <div className="h-[14px] w-full bg-surface-highlight rounded-none animate-pulse" />
                <div className="h-[14px] w-[80%] bg-surface-highlight rounded-none animate-pulse" />
                <div className="h-[14px] w-[60%] bg-surface-highlight rounded-none animate-pulse" />
              </div>
            </div>
            <div className="sharp-panel p-6">
              <div className="h-[18px] w-[160px] bg-surface-highlight rounded-none animate-pulse mb-4" />
              <div className="h-[384px] bg-surface-highlight rounded-none animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
