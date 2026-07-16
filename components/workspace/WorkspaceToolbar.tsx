'use client';

import { InterviewPhase } from '@/types';

const PHASE_LABELS: Record<InterviewPhase, string> = {
  problem: 'Problem',
  system_design: 'System Design',
  tech_assessment: 'Tech Assessment',
  deep_dive: 'Deep Dive',
  research: 'Research',
  complete: 'Complete',
};

interface WorkspaceToolbarProps {
  onAddNode: () => void;
  onGenerateBlueprint: () => void;
  nodeCount: number;
  phase?: InterviewPhase;
}

export default function WorkspaceToolbar({ onAddNode, onGenerateBlueprint, nodeCount, phase }: WorkspaceToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-surface-border">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-text-muted text-[18px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
          account_tree
        </span>
        <span className="text-text-muted font-mono text-[11px] uppercase tracking-wider">
          Workspace
        </span>
        <span className="text-text-muted font-mono text-[10px]">
          {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
        </span>
        {phase && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-surface-border">
            <div className={`phase-dot phase-${phase}`} />
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              {PHASE_LABELS[phase]}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAddNode}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border text-text-muted text-[12px] font-mono hover:border-white/30 hover:text-text-main transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
            add
          </span>
          Add Node
        </button>

        <button
          onClick={onGenerateBlueprint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[12px] font-mono font-bold hover:bg-neutral-200 transition-colors"
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
