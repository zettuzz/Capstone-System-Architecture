import React from 'react';

interface SidebarItem {
  icon: string;
  label: string;
  active?: boolean;
}

interface BlueprintSidebarProps {
  items: SidebarItem[];
  docName: string;
  onItemClick?: (label: string) => void;
}

export const BlueprintSidebar: React.FC<BlueprintSidebarProps> = ({
  items,
  docName,
  onItemClick,
}) => {
  return (
    <aside className="w-72 flex-none border-r border-outline-dim flex flex-col bg-black z-0 font-mono">
      <div className="p-5 border-b border-outline-dim">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
          Doc Structure
        </h2>
        <p className="text-xs font-semibold text-white truncate">{docName}</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => onItemClick?.(item.label)}
            className={`w-full flex items-center gap-3 px-3 py-2 transition-colors group border ${
              item.active
                ? 'bg-white text-black border-white'
                : 'text-white/50 hover:text-white hover:bg-zinc-900 border-transparent hover:border-outline-dim'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
            <span
              className={`text-[11px] uppercase tracking-wider ${
                item.active ? 'font-bold' : 'font-medium'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-outline-dim text-center">
        <p className="text-[10px] text-white/30 uppercase tracking-tighter">
          Sync: 100% | Auto-save active
        </p>
      </div>
    </aside>
  );
};
