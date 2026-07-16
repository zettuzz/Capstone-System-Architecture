'use client';

import { useState, useRef, useEffect } from 'react';

interface AddNodeModalProps {
  onAdd: (title: string) => void;
  onClose: () => void;
}

const SUGGESTED_TOPICS = [
  'Problem Definition',
  'Tech Stack',
  'Database Design',
  'System Architecture',
  'User Interface',
  'Research & Literature',
  'Methodology',
  'Testing Plan',
  'Deployment',
  'Timeline & Milestones',
];

export default function AddNodeModal({ onAdd, onClose }: AddNodeModalProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
    }
  };

  const handleSuggestion = (topic: string) => {
    onAdd(topic);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-surface border border-surface-border w-full max-w-[400px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center justify-between">
            <h3 className="text-text-main font-mono text-sm font-bold">Add New Node</h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-main transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic name..."
            className="w-full bg-surface-highlight text-text-main text-sm font-mono p-3 border border-surface-border focus:border-white/30 outline-none placeholder:text-text-muted"
          />
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-surface-border text-text-muted text-[12px] font-mono hover:border-white/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-3 py-2 bg-white text-black text-[12px] font-mono font-bold hover:bg-neutral-200 disabled:opacity-30 transition-colors"
            >
              Create Node
            </button>
          </div>
        </form>

        <div className="px-4 pb-4">
          <p className="text-text-muted text-[10px] font-mono uppercase tracking-wider mb-2">Quick add</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => handleSuggestion(topic)}
                className="px-2 py-1 border border-surface-border text-text-muted text-[11px] font-mono hover:border-white/30 hover:text-text-main transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
