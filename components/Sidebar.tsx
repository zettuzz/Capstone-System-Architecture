'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
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
          onClick={() => router.push('/')}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-text-muted hover:text-white hover:bg-surface-highlight rounded-none transition-colors font-mono text-[13px]"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
            add
          </span>
          New Chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <button
          onClick={() => router.push('/workspace')}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-text-muted hover:text-white hover:bg-surface-highlight rounded-none transition-colors font-mono text-[13px]"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
            account_tree
          </span>
          Workspace
        </button>
        <button
          onClick={() => router.push('/study')}
          className="flex items-center gap-2 w-full px-3 py-2 text-left text-text-muted hover:text-white hover:bg-surface-highlight rounded-none transition-colors font-mono text-[13px]"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
            school
          </span>
          Study Cards
        </button>
        <p className="text-[11px] font-mono text-text-muted uppercase tracking-[0.1em] px-3 py-2 pt-4">
          No recent chats
        </p>
      </nav>

      <div className="p-3 border-t border-surface-border">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-none sharp-panel flex items-center justify-center shrink-0 text-text-muted">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
                person
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-mono text-text-main truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-8 h-8 flex items-center justify-center rounded-none text-text-muted hover:text-white transition-colors shrink-0"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
                logout
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
