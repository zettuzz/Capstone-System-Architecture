'use client';

import React from 'react';
import Link from 'next/link';

export default function BlueprintStudio() {
  const navItems = [
    { icon: 'subject', label: 'Abstract & Overview', active: true },
    { icon: 'architecture', label: 'Architecture', active: false },
    { icon: 'data_object', label: 'Tech Stack', active: false },
    { icon: 'timeline', label: 'Timeline', active: false },
    { icon: 'warning', label: 'Risk Assess', active: false },
  ];

  return (
    <div className="flex flex-col h-screen bg-black text-white selection:bg-white selection:text-black font-body">
      {/* Minimal Header */}
      <header className="flex-none h-16 border-b border-surface-border flex items-center justify-between px-6 z-10 bg-black">
        <div className="flex items-center gap-4">
          <Link 
            href="/chat" 
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            title="Back to Chat"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white"></div>
            <h1 className="font-display font-bold text-lg tracking-tight uppercase">Blueprint Studio</h1>
          </div>
        </div>
        <button className="h-10 px-6 bg-white text-black font-mono font-bold text-xs tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-all border border-white">
          EXPORT .MD
          <span className="material-symbols-outlined text-[18px]">download</span>
        </button>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Navigation Outline */}
        <aside className="w-72 flex-none border-r border-surface-border flex flex-col bg-black z-0 font-mono">
          <div className="p-5 border-b border-surface-border">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-1">Doc Structure</h2>
            <p className="text-xs font-semibold text-text-main truncate">STUDY_PLANNER.MD</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors group border ${
                  item.active
                    ? 'bg-white text-black border-white'
                    : 'text-text-muted hover:text-text-main hover:bg-white/5 border-transparent hover:border-surface-border'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${item.active ? 'text-black' : 'text-text-muted group-hover:text-text-main'}`}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-surface-border text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-tighter">Sync: 100% | Auto-save active</p>
          </div>
        </aside>

        {/* Right Pane: Markdown Preview */}
        <section className="flex-1 overflow-y-auto relative bg-background-dark">
          <div className="max-w-4xl mx-auto py-12 px-8">
            {/* Rendered Document Container */}
            <div className="border border-surface-border bg-black p-12 relative shadow-none">
              {/* Document Content */}
              <article className="max-w-none">
                <h1 className="text-4xl font-display font-bold tracking-tight mb-8 pb-8 border-b border-surface-border text-text-main">
                  Project Proposal: AI-powered Study Planner
                </h1>
                
                <section className="mb-12">
                  <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-text-muted mb-4">01. Abstract</h2>
                  <p className="text-[15px] leading-relaxed text-text-main/80 font-body">
                    This document outlines the architecture, timeline, and feasibility of building an AI-powered study planner tailored for university students. The proposed system leverages Large Language Models (LLMs) to automatically ingest complex syllabi, break them down into granular concepts, and generate dynamically adjusting, daily actionable tasks based on the student's unique schedule and learning pace.
                  </p>
                </section>

                <section className="mb-12">
                  <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-text-muted mb-4">02. System Architecture</h2>
                  <p className="text-[15px] leading-relaxed text-text-main/80 font-body mb-8">
                    The architecture follows a modern serverless approach, separating the client interface from the heavy processing required for syllabus extraction and schedule generation.
                  </p>
                  
                  {/* Code Block Component */}
                  <div className="my-8 border border-surface-border bg-surface">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-surface-border">
                      <span className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">Mermaid Diagram</span>
                      <button className="text-text-muted hover:text-text-main transition-colors">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                    <div className="p-6 overflow-x-auto bg-black/50">
                      <pre className="font-mono text-[13px] text-text-main leading-relaxed">
                        <code>{`graph TD
    A[Client UI - React] -->|Uploads PDF| B(API Gateway)
    B --> C{Orchestrator - Node.js}
    C -->|Extracts Text| D[OCR Service]
    C -->|Analyzes Structure| E[LLM Provider - OpenAI]
    E -->|Structured JSON| C
    C -->|Saves State| F[(PostgreSQL db)]
    C -->|Returns Schedule| A`}</code>
                      </pre>
                    </div>
                  </div>
                </section>

                <section className="mb-12">
                  <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-text-muted mb-4">03. Tech Stack Validation</h2>
                  <ul className="list-none p-0 space-y-4 text-[14px] text-text-main/70 font-mono">
                    <li className="flex gap-4 items-baseline">
                      <span className="text-text-muted text-[10px]">●</span>
                      <span>
                        <strong className="text-text-main uppercase tracking-wider text-[12px]">Frontend:</strong> React (Next.js) for robust routing and SSR.
                      </span>
                    </li>
                    <li className="flex gap-4 items-baseline">
                      <span className="text-text-muted text-[10px]">●</span>
                      <span>
                        <strong className="text-text-main uppercase tracking-wider text-[12px]">Backend:</strong> Node.js edge functions for low-latency responses.
                      </span>
                    </li>
                    <li className="flex gap-4 items-baseline">
                      <span className="text-text-muted text-[10px]">●</span>
                      <span>
                        <strong className="text-text-main uppercase tracking-wider text-[12px]">Database:</strong> PostgreSQL via Supabase for relational mapping.
                      </span>
                    </li>
                    <li className="flex gap-4 items-baseline">
                      <span className="text-text-muted text-[10px]">●</span>
                      <span>
                        <strong className="text-text-main uppercase tracking-wider text-[12px]">AI/ML:</strong> OpenAI GPT-4o-mini for text structuring.
                      </span>
                    </li>
                  </ul>
                </section>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
