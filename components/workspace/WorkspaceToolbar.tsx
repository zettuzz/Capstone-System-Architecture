'use client';

interface WorkspaceToolbarProps {
  onGenerateBlueprint: () => void;
  onNewIdea: () => void;
  onAutoLayout: () => void;
  nodeCount: number;
  blueprintReady: boolean;
  projectTitle?: string;
}

export default function WorkspaceToolbar({ onGenerateBlueprint, onNewIdea, onAutoLayout, nodeCount, blueprintReady, projectTitle }: WorkspaceToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-surface-border">
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-symbols-outlined text-text-muted text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
          account_tree
        </span>
        {projectTitle && (
          <span className="text-text-main font-mono text-[12px] font-bold truncate max-w-[240px]">
            {projectTitle}
          </span>
        )}
        <span className="text-text-muted font-mono text-[10px] shrink-0">
          {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onNewIdea}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border text-text-muted text-[12px] font-mono hover:border-white/30 hover:text-text-main transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
            lightbulb
          </span>
          New Idea
        </button>

        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border text-text-muted text-[12px] font-mono hover:border-white/30 hover:text-text-main transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
            auto_fix
          </span>
          Auto Layout
        </button>

        <button
          onClick={onGenerateBlueprint}
          disabled={!blueprintReady}
          title={blueprintReady ? 'Generate Blueprint' : 'Finish generating the structure first'}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono font-bold transition-colors ${
            blueprintReady
              ? 'bg-white text-black hover:bg-neutral-200'
              : 'bg-white/20 text-text-muted cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 600 'GRAD' 0 'opsz' 20" }}>
            auto_awesome
          </span>
          Generate Blueprint
        </button>
      </div>
    </div>
  );
}
