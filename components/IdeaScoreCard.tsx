import { Evaluation } from '@/types';
import { TerminalPanel } from '@/components/terminal/TerminalPanel';

export default function IdeaScoreCard({ evaluation }: { evaluation: Evaluation }) {
  return (
    <TerminalPanel className="space-y-8 p-8 border border-outline-dim">
      <div className="flex items-center gap-3 border-b border-outline-dim pb-6">
        <div className="w-3 h-3 bg-primary"></div>
        <h2 className="text-2xl font-bold font-display text-primary uppercase tracking-tight">
          {evaluation.title}
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <div className="border border-outline-dim p-6 text-center bg-surface">
          <div className="text-3xl font-bold text-primary font-mono mb-1">{evaluation.score}/10</div>
          <div className="text-[10px] uppercase tracking-widest text-muted font-mono">
            Overall Score
          </div>
        </div>
        <div className="border border-outline-dim p-6 text-center bg-surface">
          <div className="text-xl font-bold text-primary font-mono mb-1">{evaluation.feasibility}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted font-mono">
            Feasibility
          </div>
        </div>
        <div className="border border-outline-dim p-6 text-center bg-surface">
          <div className="text-xl font-bold text-primary font-mono mb-1">{evaluation.timeframe}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted font-mono">
            Timeframe
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
          Suggested Tech Stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {evaluation.suggestedStack.map((tech, i) => (
            <div
              key={i}
              className="px-3 py-1.5 border border-outline-dim bg-surface-highlight text-[11px] font-mono text-primary/80 uppercase"
            >
              {tech}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
          Research Gap
        </h3>
        <p className="text-[14px] leading-relaxed text-primary font-body bg-surface-highlight/30 p-4 border-l-2 border-primary">
          {evaluation.researchGap}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
          Suggested Improvements
        </h3>
        <ul className="space-y-3 font-body">
          {evaluation.improvements.map((item, i) => (
            <li key={i} className="flex gap-4 items-start text-[14px] text-primary">
              <span className="text-primary pt-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </TerminalPanel>
  );
}