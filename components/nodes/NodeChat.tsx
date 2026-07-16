'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import type { InterviewInstruction, InterviewPhase } from '@/types';

const md = new MarkdownIt({ html: false, breaks: true, linkify: true });

const INSTRUCTION_REGEX = /<!--\s*INTERVIEW_INSTRUCTION\s*([\s\S]*?)\s*-->/;

function parseInstruction(content: string): { clean: string; instruction: InterviewInstruction | null } {
  const match = content.match(INSTRUCTION_REGEX);
  if (!match) return { clean: content, instruction: null };

  const clean = content.replace(INSTRUCTION_REGEX, '').trim();
  try {
    const instruction = JSON.parse(match[1]) as InterviewInstruction;
    return { clean, instruction };
  } catch {
    return { clean, instruction: null };
  }
}

const PHASE_LABELS: Record<InterviewPhase, string> = {
  problem: 'Problem',
  system_design: 'System Design',
  tech_assessment: 'Tech Assessment',
  deep_dive: 'Deep Dive',
  research: 'Research',
  complete: 'Complete',
};

interface NodeChatProps {
  messages: { role: 'user' | 'assistant'; content: string }[];
  onAddMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  onSuggestNode: (title: string) => void;
  onNodeCreate?: (instruction: InterviewInstruction) => void;
  nodeTitle: string;
  nodeType: 'idea' | 'topic' | 'research' | 'blueprint';
  phase?: InterviewPhase;
  autoMessage?: string;
}

export default function NodeChat({ messages, onAddMessage, onSuggestNode, onNodeCreate, nodeTitle, nodeType, phase, autoMessage }: NodeChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user' as const, content: text };
    onAddMessage(userMsg);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    try {
      const systemContext = getSystemContext(nodeTitle, nodeType, phase);
      const chatMessages = [
        { role: 'system', content: systemContext },
        ...messages,
        userMsg,
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          title: nodeTitle,
          nodeTitle: nodeTitle,
          nodeContext: `This chat is about: ${nodeTitle}`,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('0:')) {
            const data = line.slice(2);
            if (data === '[DONE]') break;
            try {
              const token = JSON.parse(data);
              fullContent += token;
            } catch {}
          }
        }
      }

      if (fullContent) {
        const { clean, instruction } = parseInstruction(fullContent);

        onAddMessage({ role: 'assistant', content: clean });

        if (instruction && onNodeCreate) {
          onNodeCreate(instruction);
        }

        if (!instruction && shouldSuggestNode(fullContent, messages)) {
          const suggestedTitle = extractNodeSuggestion(fullContent);
          if (suggestedTitle) {
            onSuggestNode(suggestedTitle);
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      onAddMessage({ role: 'assistant', content: 'Connection error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, nodeTitle, nodeType, phase, onAddMessage, onSuggestNode, onNodeCreate]);

  useEffect(() => {
    if (autoMessage && !autoSentRef.current && messages.length === 0) {
      autoSentRef.current = true;
      sendMessage(autoMessage);
    }
  }, [autoMessage, messages.length, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSearch = async () => {
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${query} ${nodeTitle}`, maxResults: 3 }),
      });

      const data = await res.json();
      if (data.results?.results?.length > 0) {
        const snippet = data.results.results
          .map((r: { title: string; url: string; content: string }) =>
            `**${r.title}** (${r.url})\n${r.content}`
          )
          .join('\n\n');

        onAddMessage({
          role: 'assistant',
          content: `## Search Results\n\n${snippet}\n\nWould you like me to analyze these results?`
        });
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {phase && (
        <div className="px-3 py-1.5 border-b border-surface-border flex items-center gap-2">
          <div className={`phase-dot phase-${phase}`} />
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
            {PHASE_LABELS[phase]}
          </span>
        </div>
      )}

      <div ref={scrollRef} className="node-chat-area p-3 space-y-3 min-h-[120px] max-h-[300px]">
        {messages.length === 0 && (
          <p className="text-text-muted text-[11px] font-mono text-center py-4">
            Start a conversation about {nodeTitle}...
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              {msg.role === 'assistant' && (
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  AI
                </span>
              )}
              <div
                className={`text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-text-main'
                    : 'prose-terminal text-text-main'
                }`}
                dangerouslySetInnerHTML={{
                  __html: msg.role === 'assistant'
                    ? md.render(msg.content)
                    : msg.content
                }}
              />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-surface-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-surface-highlight text-text-main text-[13px] font-mono p-2 border border-surface-border focus:border-white/30 outline-none resize-none placeholder:text-text-muted"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-2 py-1 bg-white text-black text-[11px] font-mono font-bold disabled:opacity-30 hover:bg-neutral-200 transition-colors"
            >
              EXE
            </button>
            <button
              onClick={handleSearch}
              disabled={!input.trim() || isLoading}
              className="px-2 py-1 border border-surface-border text-text-muted text-[10px] font-mono disabled:opacity-30 hover:border-white/30 hover:text-text-main transition-colors"
              title="Search web"
            >
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 20" }}>
                search
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSystemContext(nodeTitle: string, nodeType: string, phase?: InterviewPhase): string {
  const baseContext = `You are CapstoneAI, helping with a capstone project.
Current topic: "${nodeTitle}" (type: ${nodeType})
Keep responses focused on this specific topic.
Only suggest FREE and open-source tools.
Be concise and actionable.`;

  if (phase) {
    return `${baseContext}\nCurrent interview phase: ${phase}. Ask questions appropriate for this phase.`;
  }

  if (nodeType === 'research') {
    return `${baseContext}\nThis node is for research. Help analyze findings, identify gaps, and suggest next research directions.`;
  }

  if (nodeType === 'topic') {
    return `${baseContext}\nThis is a sub-topic of the main project. Provide specific guidance for this area.`;
  }

  return baseContext;
}

function shouldSuggestNode(content: string, existingMessages: { role: string; content: string }[]): boolean {
  if (existingMessages.length < 3) return false;

  const suggestionPatterns = [
    /we should (also|now) (talk about|discuss|consider|explore)/i,
    /this (relates?|connects?|leads?) to/i,
    /you might want to (also|separately)/i,
    /let's (create|start|make) (a |another )?(new )?(separate )?(node|topic|thread)/i,
  ];

  return suggestionPatterns.some(p => p.test(content));
}

function extractNodeSuggestion(content: string): string | null {
  const patterns = [
    /let's (?:create|start|make) (?:a |another )?(?:new )?(?:separate )?(?:node|topic|thread) (?:for |about |on )["']?([^"'.]+)["']?/i,
    /(?:create|start|make) (?:a |another )?(?:new )?(?:node|topic|thread) (?:for |about |on )["']?([^"'.]+)["']?/i,
    /(?:talk about|discuss|consider|explore) ["']?([^"'.]+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1].trim().slice(0, 50);
    }
  }

  return null;
}
