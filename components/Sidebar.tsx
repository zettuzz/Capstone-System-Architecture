'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import APIKeyPrompt from '@/components/APIKeyPrompt';
import { useLLMProvider } from '@/components/LLMProviderContext';
import { UserButton } from '@clerk/nextjs';

interface ProjectItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  currentProjectId?: string;
}

export default function Sidebar({ currentProjectId }: SidebarProps) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { userKeys, tokensRemaining, tokenBudget } = useLLMProvider();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        setProjects(data.projects || []);
      } catch {
        setProjects([]);
      }
      setProjectsLoading(false);
    };
    fetchProjects();
  }, [pathname]);

  const handleNewProject = () => {
    router.push('/');
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProjectId === id) {
        router.push('/');
      }
    } catch {
      console.error('Delete failed');
    }
    setConfirmDeleteId(null);
  };

  const hasAnyKey = !!(userKeys.openrouter || userKeys.nvidia);

  return (
    <>
      <aside className="w-[260px] h-screen flex flex-col bg-surface border-r border-surface-border shrink-0">
        <div className="p-4 border-b border-surface-border">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 w-full text-left"
          >
            <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
              memory
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-lg font-bold tracking-[-0.015em] font-display">
              CapstoneAI
            </span>
          </button>
        </div>

        <div className="p-3 border-b border-surface-border">
          <button
            onClick={handleNewProject}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-text-muted hover:text-white hover:bg-surface-highlight rounded-none transition-colors font-mono text-[13px]"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
              add
            </span>
            New Project
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {projects.length > 0 && (
            <p className="text-[11px] font-mono text-text-muted uppercase tracking-[0.1em] px-3 py-2">
              Projects
            </p>
          )}

          {projectsLoading ? (
            <p className="text-[12px] font-mono text-text-muted px-3 py-2">Loading...</p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="relative group"
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => { setHoveredId(null); setConfirmDeleteId(null); }}
              >
                {confirmDeleteId === project.id ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-highlight">
                    <span className="text-[11px] font-mono text-red-400 truncate">Delete {project.title}?</span>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="px-2 py-0.5 text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors shrink-0"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 text-[10px] font-mono text-text-muted border border-surface-border hover:text-text-main transition-colors shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push(`/workspace?project=${project.id}`)}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-left rounded-none transition-colors font-mono text-[13px] ${
                      currentProjectId === project.id
                        ? 'text-white bg-surface-highlight'
                        : 'text-text-muted hover:text-white hover:bg-surface-highlight'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] shrink-0" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
                      account_tree
                    </span>
                    <span className="truncate flex-1">{project.title}</span>
                    {hoveredId === project.id && (
                      <span
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(project.id); }}
                        className="material-symbols-outlined text-text-muted hover:text-red-400 text-[16px] opacity-60 hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                        style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}
                      >
                        more_horiz
                      </span>
                    )}
                  </button>
                )}
              </div>
            ))
          )}

          {!projectsLoading && projects.length === 0 && (
            <p className="text-[11px] font-mono text-text-muted px-3 py-2">
              No projects yet
            </p>
          )}
        </nav>

        <div className="p-3 border-t border-surface-border space-y-3">
          <button
            onClick={() => setShowKeyPrompt(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-text-muted hover:text-white hover:bg-surface-highlight rounded-none transition-colors font-mono text-[12px]"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
              key
            </span>
            {hasAnyKey ? 'Edit API Keys' : 'Configure API Key'}
            {!hasAnyKey && tokensRemaining < tokenBudget.totalLimit && tokensRemaining > 0 && (
              <span className="ml-auto text-[10px] text-text-muted">{Math.round(tokensRemaining / 1000)}K left</span>
            )}
          </button>

          {user && (
            <div className="flex items-center gap-3 px-3 py-2 mt-1">
              <UserButton />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-mono text-text-main truncate">{user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {showKeyPrompt && (
        <APIKeyPrompt onClose={() => setShowKeyPrompt(false)} />
      )}
    </>
  );
}
