'use client';

import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: false, breaks: true, linkify: true });

interface BlueprintPanelProps {
  markdown: string;
  schedule: { week: number; title: string; tasks: string[]; milestone?: string }[];
  isLoading: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export default function BlueprintPanel({ markdown, schedule, isLoading, onClose, onDownload }: BlueprintPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[600px] flex flex-col bg-surface border-l border-surface-border shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-text-muted text-[18px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
            description
          </span>
          <span className="text-text-main font-mono text-sm font-bold">Blueprint</span>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && markdown && (
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[12px] font-mono font-bold hover:bg-neutral-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 600 'GRAD' 0 'opsz' 20" }}>
                download
              </span>
              Download
            </button>
          )}
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-[14px] w-[200px] bg-surface-highlight animate-pulse" />
            <div className="space-y-2">
              <div className="h-[12px] w-full bg-surface-highlight animate-pulse" />
              <div className="h-[12px] w-[80%] bg-surface-highlight animate-pulse" />
              <div className="h-[12px] w-[60%] bg-surface-highlight animate-pulse" />
            </div>
            <div className="h-[14px] w-[160px] bg-surface-highlight animate-pulse" />
            <div className="h-[120px] bg-surface-highlight animate-pulse" />
            <p className="text-text-muted text-[11px] font-mono text-center py-4">
              Generating blueprint from all nodes...
            </p>
          </div>
        ) : markdown ? (
          <>
            {/* Schedule Section */}
            {schedule.length > 0 && (
              <div className="sharp-panel p-4">
                <h3 className="text-text-main font-mono text-sm font-bold mb-3">Project Schedule</h3>
                <div className="space-y-2">
                  {schedule.map((item, i) => (
                    <div key={i} className="p-2 bg-surface-highlight border border-surface-border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold text-text-muted bg-white/5 px-1.5 py-0.5 border border-white/10">
                          W{item.week}
                        </span>
                        <span className="text-text-main text-xs font-medium">{item.title}</span>
                        {item.milestone && (
                          <span className="font-mono text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 border border-green-500/20 ml-auto">
                            {item.milestone}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-0.5 ml-6">
                        {item.tasks.map((task, j) => (
                          <li key={j} className="text-text-muted text-[11px] font-mono flex items-start gap-1">
                            <span className="text-text-muted shrink-0">·</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Blueprint */}
            <div className="sharp-panel p-4">
              <h3 className="text-text-main font-mono text-sm font-bold mb-3">Full Blueprint</h3>
              <div
                className="prose-terminal text-text-main text-[13px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: md.render(markdown) }}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-text-muted text-[32px]">description</span>
            <p className="text-text-muted text-[11px] font-mono mt-2">
              Click "Generate Blueprint" to create your project document.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
