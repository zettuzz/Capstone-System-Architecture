'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Evaluation, ScheduleItem } from '@/types';
import IdeaScoreCard from '@/components/IdeaScoreCard';
import Sidebar from '@/components/Sidebar';

function ResultContent() {
  const searchParams = useSearchParams();

  const evaluation = searchParams.get('evaluation');
  const markdown = searchParams.get('markdown');
  const scheduleParam = searchParams.get('schedule');

  const parsedEvaluation = evaluation ? (() => {
    try {
      return JSON.parse(evaluation) as Evaluation;
    } catch {
      return null;
    }
  })() : null;

  const parsedMarkdown = markdown ? decodeURIComponent(markdown) : '';
  const parsedSchedule: ScheduleItem[] = scheduleParam ? (() => {
    try {
      return JSON.parse(decodeURIComponent(scheduleParam));
    } catch {
      return [];
    }
  })() : [];

  const downloadMarkdown = () => {
    if (!parsedEvaluation || !parsedMarkdown) return;
    const blob = new Blob([parsedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parsedEvaluation.title.replace(/\s+/g, '_')}_Capstone_Blueprint.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!parsedEvaluation) {
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <button
          type="button"
          onClick={downloadMarkdown}
          className="fixed top-4 right-6 z-20 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-[13px] px-6 py-2 rounded-none transition-all duration-200 active:scale-95 flex items-center gap-2 border border-white"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 600 'GRAD' 0 'opsz' 20" }}>
            download
          </span>
          Download
        </button>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[800px] mx-auto space-y-6">
            {/* Score Card */}
            <div className="sharp-panel p-6">
              <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-text-muted mb-2">
                Generated for: {parsedEvaluation.title}
              </p>
              <IdeaScoreCard evaluation={parsedEvaluation} />
            </div>

            {/* GitHub Similar Projects */}
            {parsedEvaluation.githubRepos && parsedEvaluation.githubRepos.length > 0 && (
              <div className="sharp-panel p-6">
                <h2 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-lg font-bold font-display mb-1">
                  Similar GitHub Projects
                </h2>
                <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-text-muted mb-4">
                  Open-source repos that overlap with your idea
                </p>
                <div className="space-y-3">
                  {parsedEvaluation.githubRepos.map((repo, i) => (
                    <a
                      key={i}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-surface/50 border border-surface-border hover:border-white/20 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px] text-text-muted">code</span>
                          <span className="text-text-main font-mono text-sm font-medium group-hover:text-white transition-colors">
                            {repo.fullName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-text-muted font-mono text-[11px]">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">star</span>
                            {repo.stars}
                          </span>
                          <span>{repo.language}</span>
                        </div>
                      </div>
                      <p className="text-text-muted text-xs mt-1 line-clamp-2">{repo.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Project Schedule */}
            {parsedSchedule.length > 0 && (
              <div className="sharp-panel p-6">
                <h2 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-lg font-bold font-display mb-1">
                  Project Schedule
                </h2>
                <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-text-muted mb-4">
                  Week-by-week breakdown generated from your blueprint
                </p>
                <div className="space-y-3">
                  {parsedSchedule.map((item, i) => (
                    <div key={i} className="p-3 bg-surface/50 border border-surface-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-[11px] font-bold text-text-muted bg-white/5 px-2 py-0.5 border border-white/10">
                          WEEK {item.week}
                        </span>
                        <span className="text-text-main text-sm font-medium">{item.title}</span>
                        {item.milestone && (
                          <span className="font-mono text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 border border-green-500/20 ml-auto">
                            {item.milestone}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {item.tasks.map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-text-muted text-xs">
                            <span className="text-text-muted mt-0.5 shrink-0">·</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Systems */}
            {parsedEvaluation.existingSystems && parsedEvaluation.existingSystems.length > 0 && (
              <div className="sharp-panel p-6">
                <h2 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-lg font-bold font-display mb-4">
                  Similar Existing Systems
                </h2>
                <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-text-muted mb-3">
                  Found via web search during evaluation
                </p>
                <ul className="space-y-2">
                  {parsedEvaluation.existingSystems.map((system, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-main font-mono text-sm">
                      <span className="text-text-muted mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                      {system}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Markdown Blueprint */}
            <div className="sharp-panel p-6">
              <h2 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-lg font-bold font-display mb-4">
                Markdown Blueprint
              </h2>
              <div className="bg-surface/50 p-4 rounded-none h-96 overflow-auto border border-surface-border font-mono text-sm text-text-main whitespace-pre-wrap">
                {parsedMarkdown}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
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
    }>
      <ResultContent />
    </Suspense>
  );
}
